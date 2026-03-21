import { useSensorStore } from '@/stores/sensorStore';
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
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
    // lost モード: callback を送らない（PG の lostTimer が自然発火する）
    if (sim.positionCallbackMode === 'lost') return;

    if (modes.position === 'sim') {
      const pos = buildChannelAwarePos(modes, sim);
      if (pos) forwardToAllPG(pos);
    } else if (lastRealPosition) {
      forwardToAllPG(mixValues(lastRealPosition, modes, sim));
    }
  }, intervalMs);
}

function immediateForward(): void {
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();
  if (sim.denied) return;
  if (pgWatches.size === 0) return;
  if (sim.positionCallbackMode === 'lost') return;

  if (modes.position === 'sim') {
    const pos = buildChannelAwarePos(modes, sim);
    if (pos) forwardToAllPG(pos);
  } else if (lastRealPosition) {
    forwardToAllPG(mixValues(lastRealPosition, modes, sim));
  }
}

function immediateForwardAndResetTimer(): void {
  immediateForward();
  const { simValues: sim } = useSensorStore.getState();
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
    fr.debug(C.SIM, "sim.activated", {});
    startSimTimer(sim.callbackIntervalMs);
    return;
  }

  // denied が ON → タイマー停止、PG に denied error
  if (sim.denied && !prevSim.denied) {
    fr.debug(C.SIM, "sim.denied", {});
    stopSimTimer();
    sendDeniedToAllPG();
    return;
  }

  // denied が OFF
  if (!sim.denied && prevSim.denied) {
    fr.debug(C.SIM, "sim.deniedOff", {});
    if (pgWatches.size > 0) {
      startSimTimer(sim.callbackIntervalMs);
      immediateForwardAndResetTimer();
    }
    return;
  }

  if (sim.denied) return;

  // channelModes 変更（heading/speed の real↔sim 切替等）→ 即時 forward
  if (modesChanged) {
    immediateForwardAndResetTimer();
    return;
  }

  if (newState.simValues === prevState.simValues) return;

  // interval 変更 → タイマー再起動
  if (sim.callbackIntervalMs !== prevSim.callbackIntervalMs) {
    if (simTimerId !== null) {
      startSimTimer(sim.callbackIntervalMs);
    }
  }

  // positionCallbackMode 変更 → lost から復帰した場合は即時 forward
  if (sim.positionCallbackMode !== prevSim.positionCallbackMode) {
    if (prevSim.positionCallbackMode === 'lost' && sim.positionCallbackMode !== 'lost') {
      immediateForwardAndResetTimer();
    }
    return;
  }

  // position 変更 → positionCallbackMode に従う
  if (sim.position !== prevSim.position) {
    if (sim.positionCallbackMode === 'sync') {
      immediateForwardAndResetTimer();
    }
    // interval/lost: タイマーに委ねる（何もしない）
  }

  // heading 変更 → headingSync に従う
  if (sim.heading !== prevSim.heading) {
    if (sim.headingSync) {
      immediateForwardAndResetTimer();
    }
  }

  // speed 変更 → speedSync に従う
  if (sim.speed !== prevSim.speed) {
    if (sim.speedSync) {
      immediateForwardAndResetTimer();
    }
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
  fr.debug(C.SIM, "sim.installed", {});

  originalWatch = navigator.geolocation.watchPosition.bind(navigator.geolocation);
  originalGetCurrent = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  originalClear = navigator.geolocation.clearWatch.bind(navigator.geolocation);

  navigator.geolocation.watchPosition = patchedWatchPosition;
  navigator.geolocation.getCurrentPosition = patchedGetCurrentPosition;
  navigator.geolocation.clearWatch = patchedClearWatch;

  useSensorStore.subscribe(onSensorChange);

  installed = true;
}
