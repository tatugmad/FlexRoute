import { useSensorStore } from '@/stores/sensorStore';
import type { SensorChannelModes, SimValues } from '@/types';

let installed = false;
let originalWatch: typeof navigator.geolocation.watchPosition | null = null;
let originalGetCurrent: typeof navigator.geolocation.getCurrentPosition | null = null;
let originalClear: typeof navigator.geolocation.clearWatch | null = null;

const pgWatches = new Map<
  number,
  { success: PositionCallback; error?: PositionErrorCallback | null }
>();
let nextVirtualId = 1;

let internalWatchId: number | null = null;
let lastRealPosition: GeolocationPosition | null = null;

let simTimerId: ReturnType<typeof setInterval> | null = null;

const hasAnySim = (modes: SensorChannelModes): boolean =>
  modes.position === 'sim' ||
  modes.heading === 'sim' ||
  modes.speed === 'sim';

// ---- データ構築 ----
function mixValues(
  realPos: GeolocationPosition,
  modes: SensorChannelModes,
  sim: SimValues,
): GeolocationPosition {
  return {
    coords: {
      latitude:
        modes.position === 'sim' && sim.position
          ? sim.position.lat
          : realPos.coords.latitude,
      longitude:
        modes.position === 'sim' && sim.position
          ? sim.position.lng
          : realPos.coords.longitude,
      heading: modes.heading === 'sim' ? sim.heading : realPos.coords.heading,
      speed: modes.speed === 'sim' ? sim.speed : realPos.coords.speed,
      accuracy:
        modes.position === 'sim' ? sim.accuracy : realPos.coords.accuracy,
      altitude: realPos.coords.altitude,
      altitudeAccuracy: realPos.coords.altitudeAccuracy,
    },
    timestamp: realPos.timestamp,
  } as GeolocationPosition;
}

/**
 * position が sim の時に使う。heading/speed は channelModes に従い
 * real 値があれば real を使う。
 */
function buildChannelAwarePos(
  modes: SensorChannelModes,
  sim: SimValues,
): GeolocationPosition | null {
  if (!sim.position) return null;
  return {
    coords: {
      latitude: sim.position.lat,
      longitude: sim.position.lng,
      heading:
        modes.heading === 'sim'
          ? sim.heading
          : (lastRealPosition?.coords.heading ?? 0),
      speed:
        modes.speed === 'sim'
          ? sim.speed
          : (lastRealPosition?.coords.speed ?? 0),
      accuracy: sim.accuracy,
      altitude: lastRealPosition?.coords.altitude ?? null,
      altitudeAccuracy: lastRealPosition?.coords.altitudeAccuracy ?? null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition;
}

function buildFakeDeniedError(): GeolocationPositionError {
  return {
    code: 1,
    message: 'Simulated: permission denied',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

// ---- PG への配信 ----
function forwardToAllPG(pos: GeolocationPosition): void {
  pgWatches.forEach(({ success }) => {
    try { success(pos); } catch { /* PG responsibility */ }
  });
}

function sendDeniedToAllPG(): void {
  const fakeError = buildFakeDeniedError();
  pgWatches.forEach(({ error }) => {
    if (error) {
      try { error(fakeError); } catch { /* PG responsibility */ }
    }
  });
}

// ---- sim callback タイマー ----
function stopSimTimer(): void {
  if (simTimerId !== null) {
    clearInterval(simTimerId);
    simTimerId = null;
  }
}

function startSimTimer(intervalMs: number): void {
  stopSimTimer();
  simTimerId = setInterval(() => {
    const { channelModes: modes, simValues: sim } = useSensorStore.getState();
    if (sim.denied) return;

    if (modes.position === 'sim') {
      const pos = buildChannelAwarePos(modes, sim);
      if (pos) forwardToAllPG(pos);
    } else if (lastRealPosition) {
      forwardToAllPG(mixValues(lastRealPosition, modes, sim));
    }
  }, intervalMs);
}

function immediateForwardAndResetTimer(): void {
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();
  if (sim.denied) return;
  if (pgWatches.size === 0) return;

  if (modes.position === 'sim') {
    const pos = buildChannelAwarePos(modes, sim);
    if (pos) forwardToAllPG(pos);
  } else if (lastRealPosition) {
    forwardToAllPG(mixValues(lastRealPosition, modes, sim));
  }

  if (simTimerId !== null) {
    startSimTimer(sim.callbackIntervalMs);
  }
}

// ---- real GPS callback ----
function onRealPosition(pos: GeolocationPosition): void {
  lastRealPosition = pos;
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();

  if (modes.position === 'sim') return;

  if (hasAnySim(modes)) {
    forwardToAllPG(mixValues(pos, modes, sim));
  } else {
    forwardToAllPG(pos);
  }
}

function onRealError(error: GeolocationPositionError): void {
  pgWatches.forEach(({ error: pgError }) => {
    if (pgError) {
      try { pgError(error); } catch { /* PG responsibility */ }
    }
  });
}

// ---- sensorStore subscription ----
function onSensorChange(
  newState: { channelModes: SensorChannelModes; simValues: SimValues },
  prevState: { channelModes: SensorChannelModes; simValues: SimValues },
): void {
  const nowSim = hasAnySim(newState.channelModes);
  const wasSim = hasAnySim(prevState.channelModes);
  const sim = newState.simValues;
  const prevSim = prevState.simValues;
  const modesChanged = newState.channelModes !== prevState.channelModes;

  // 全チャンネル real に戻った → タイマー停止、最後の real 位置を PG に渡す
  if (!nowSim && wasSim) {
    stopSimTimer();
    if (lastRealPosition) forwardToAllPG(lastRealPosition);
    return;
  }

  if (!nowSim) return;

  // sim がアクティブになった → タイマー開始
  if (nowSim && !wasSim && !sim.denied) {
    startSimTimer(sim.callbackIntervalMs);
    return;
  }

  // denied が ON になった → タイマー停止、PG に denied error を送る
  if (sim.denied && !prevSim.denied) {
    stopSimTimer();
    sendDeniedToAllPG();
    return;
  }

  // denied が OFF になった
  if (!sim.denied && prevSim.denied) {
    if (pgWatches.size > 0) {
      startSimTimer(sim.callbackIntervalMs);
      immediateForwardAndResetTimer();
    }
    return;
  }

  // denied 中は他の変更は無視
  if (sim.denied) return;

  // channelModes 変更（heading/speed の real↔sim 切替等）→ 即時 forward
  if (modesChanged) {
    immediateForwardAndResetTimer();
    return;
  }

  // simValues 変更なし → skip
  if (newState.simValues === prevState.simValues) return;

  // interval 変更 → タイマー再起動
  if (sim.callbackIntervalMs !== prevSim.callbackIntervalMs) {
    if (simTimerId !== null) {
      startSimTimer(sim.callbackIntervalMs);
    }
  }

  // position/heading/speed/accuracy 変更 → 即時発火 + タイマーリセット
  if (
    sim.position !== prevSim.position ||
    sim.heading !== prevSim.heading ||
    sim.speed !== prevSim.speed ||
    sim.accuracy !== prevSim.accuracy
  ) {
    immediateForwardAndResetTimer();
  }
}

// ---- internal real watch ----
function ensureInternalWatch(options?: PositionOptions): void {
  if (internalWatchId !== null) return;
  if (!originalWatch) return;

  internalWatchId = originalWatch(
    onRealPosition,
    onRealError,
    options ?? { enableHighAccuracy: true, maximumAge: 0 },
  );
}

function stopInternalWatch(): void {
  if (internalWatchId !== null && originalClear) {
    originalClear(internalWatchId);
    internalWatchId = null;
  }
}

// ---- パッチされた API ----
function patchedWatchPosition(
  success: PositionCallback,
  error?: PositionErrorCallback | null,
  options?: PositionOptions,
): number {
  const virtualId = nextVirtualId++;
  pgWatches.set(virtualId, { success, error });
  ensureInternalWatch(options);

  const { channelModes, simValues } = useSensorStore.getState();
  if (channelModes.position === 'sim' && !simValues.denied && simTimerId === null) {
    startSimTimer(simValues.callbackIntervalMs);
  }

  return virtualId;
}

function patchedGetCurrentPosition(
  success: PositionCallback,
  error?: PositionErrorCallback | null,
  options?: PositionOptions,
): void {
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();

  if (modes.position === 'sim' && sim.denied) {
    if (error) error(buildFakeDeniedError());
    return;
  }

  if (modes.position === 'sim') {
    const pos = buildChannelAwarePos(modes, sim);
    if (pos) {
      success(pos);
      return;
    }
    if (lastRealPosition) {
      success(mixValues(lastRealPosition, modes, sim));
      return;
    }
    return;
  }

  if (hasAnySim(modes) && lastRealPosition) {
    success(mixValues(lastRealPosition, modes, sim));
    return;
  }

  originalGetCurrent!(success, error ?? undefined, options);
}

function patchedClearWatch(id: number): void {
  pgWatches.delete(id);
  if (pgWatches.size === 0) {
    stopInternalWatch();
    stopSimTimer();
  }
}

// ---- install ----
export function installSimGeolocation(): void {
  if (installed) return;
  if (!navigator.geolocation) return;

  originalWatch = navigator.geolocation.watchPosition.bind(navigator.geolocation);
  originalGetCurrent = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  originalClear = navigator.geolocation.clearWatch.bind(navigator.geolocation);

  navigator.geolocation.watchPosition = patchedWatchPosition;
  navigator.geolocation.getCurrentPosition = patchedGetCurrentPosition;
  navigator.geolocation.clearWatch = patchedClearWatch;

  useSensorStore.subscribe(onSensorChange);

  installed = true;
}
