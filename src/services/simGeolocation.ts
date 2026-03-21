import { useSensorStore } from '@/stores/sensorStore';
import type { SensorChannelModes, SimValues } from '@/types';

let installed = false;
let originalWatch: typeof navigator.geolocation.watchPosition | null = null;
let originalGetCurrent: typeof navigator.geolocation.getCurrentPosition | null = null;
let originalClear: typeof navigator.geolocation.clearWatch | null = null;

// PG の watchPosition 登録
const pgWatches = new Map<
  number,
  { success: PositionCallback; error?: PositionErrorCallback | null }
>();
let nextVirtualId = 1;

// 内部 real GPS watch
let internalWatchId: number | null = null;
let lastRealPosition: GeolocationPosition | null = null;

// sim callback タイマー
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

function buildFakePos(sim: SimValues): GeolocationPosition | null {
  if (!sim.position) return null;
  return {
    coords: {
      latitude: sim.position.lat,
      longitude: sim.position.lng,
      heading: sim.heading,
      speed: sim.speed,
      accuracy: sim.accuracy,
      altitude: null,
      altitudeAccuracy: null,
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
    if (modes.position !== 'sim' || sim.denied) return;

    if (modes.position === 'sim') {
      const fakePos = buildFakePos(sim);
      if (fakePos) forwardToAllPG(fakePos);
    } else if (lastRealPosition) {
      forwardToAllPG(mixValues(lastRealPosition, modes, sim));
    }
  }, intervalMs);
}

// sim 値変更時に即時発火（十字キー等の応答性のため）+ タイマーリセット
function immediateForwardAndResetTimer(): void {
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();
  if (sim.denied) return;
  if (pgWatches.size === 0) return;

  if (modes.position === 'sim') {
    const fakePos = buildFakePos(sim);
    if (fakePos) forwardToAllPG(fakePos);
  } else if (lastRealPosition) {
    forwardToAllPG(mixValues(lastRealPosition, modes, sim));
  }

  // タイマーリセット（次の定期 tick までの間隔をリスタート）
  if (simTimerId !== null) {
    startSimTimer(sim.callbackIntervalMs);
  }
}

// ---- real GPS callback ----
function onRealPosition(pos: GeolocationPosition): void {
  lastRealPosition = pos;
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();

  // position が sim → real GPS は PG に直接転送しない（タイマーが担当）
  if (modes.position === 'sim') return;

  // position が real（heading/speed だけ sim）→ 混合して転送
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
  // → pgWatches が空の場合（PG が clearWatch 済み）は何もしない。
  //   PG の deniedRetry が getCurrentPosition を呼んだ時に
  //   patchedGetCurrentPosition が応答し、PG が復帰する。
  //   PG が watchPosition を再開したらタイマーを開始する。
  // → pgWatches がある場合はタイマー再開 + 即時発火。
  if (!sim.denied && prevSim.denied) {
    if (pgWatches.size > 0) {
      startSimTimer(sim.callbackIntervalMs);
      immediateForwardAndResetTimer();
    }
    return;
  }

  // denied 中は他の変更は無視
  if (sim.denied) return;

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
  // subscription は停止しない
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

  // position sim で denied でなければタイマー開始
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

  // denied → error callback
  if (modes.position === 'sim' && sim.denied) {
    if (error) error(buildFakeDeniedError());
    return;
  }

  // position sim → sim 値を返す
  if (modes.position === 'sim') {
    const fakePos = buildFakePos(sim);
    if (fakePos) {
      success(fakePos);
      return;
    }
    if (lastRealPosition) {
      success(mixValues(lastRealPosition, modes, sim));
      return;
    }
    return;
  }

  // heading/speed だけ sim → 混合値を返す
  if (hasAnySim(modes) && lastRealPosition) {
    success(mixValues(lastRealPosition, modes, sim));
    return;
  }

  // 全て real → 本物の API に転送
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

  // subscription は install 時に開始し、常に維持する（unsubscribe 不要）
  useSensorStore.subscribe(onSensorChange);

  installed = true;
}
