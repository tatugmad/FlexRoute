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
let unsubscribeSensor: (() => void) | null = null;

const hasAnySim = (modes: SensorChannelModes): boolean =>
  modes.position === 'sim' ||
  modes.heading === 'sim' ||
  modes.speed === 'sim';

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

function forwardToAllPG(pos: GeolocationPosition): void {
  pgWatches.forEach(({ success }) => {
    try {
      success(pos);
    } catch {
      /* PG's error handling is PG's responsibility */
    }
  });
}

function sendDeniedToAllPG(): void {
  const fakeError = buildFakeDeniedError();
  pgWatches.forEach(({ error }) => {
    if (error) {
      try {
        error(fakeError);
      } catch {
        /* PG's error handling is PG's responsibility */
      }
    }
  });
}

function onRealPosition(pos: GeolocationPosition): void {
  lastRealPosition = pos;
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();

  if (!hasAnySim(modes)) {
    forwardToAllPG(pos);
    return;
  }

  if (modes.position === 'sim' && sim.positionQuality !== 'active') {
    return;
  }

  const mixed = mixValues(pos, modes, sim);
  forwardToAllPG(mixed);
}

function onRealError(error: GeolocationPositionError): void {
  pgWatches.forEach(({ error: pgError }) => {
    if (pgError) {
      try {
        pgError(error);
      } catch {
        /* PG's error handling is PG's responsibility */
      }
    }
  });
}

function onSensorChange(
  newState: { channelModes: SensorChannelModes; simValues: SimValues },
  prevState: { channelModes: SensorChannelModes; simValues: SimValues },
): void {
  const nowSim = hasAnySim(newState.channelModes);
  const wasSim = hasAnySim(prevState.channelModes);

  if (!nowSim && wasSim) {
    if (lastRealPosition) {
      forwardToAllPG(lastRealPosition);
    }
    return;
  }

  if (!nowSim) return;

  if (newState.simValues === prevState.simValues) return;

  const sim = newState.simValues;
  const modes = newState.channelModes;

  if (modes.position === 'sim' && sim.positionQuality === 'denied') {
    if (prevState.simValues.positionQuality !== 'denied') {
      sendDeniedToAllPG();
    }
    return;
  }

  if (modes.position === 'sim' && sim.positionQuality === 'lost') {
    return;
  }

  if (modes.position === 'sim') {
    const fakePos = buildFakePos(sim);
    if (fakePos) forwardToAllPG(fakePos);
  } else if (lastRealPosition) {
    const mixed = mixValues(lastRealPosition, modes, sim);
    forwardToAllPG(mixed);
  }
}

function ensureInternalWatch(options?: PositionOptions): void {
  if (internalWatchId !== null) return;
  if (!originalWatch) return;

  internalWatchId = originalWatch(
    onRealPosition,
    onRealError,
    options ?? { enableHighAccuracy: true, maximumAge: 0 },
  );

  if (!unsubscribeSensor) {
    unsubscribeSensor = useSensorStore.subscribe(onSensorChange);
  }
}

function stopInternalWatch(): void {
  if (internalWatchId !== null && originalClear) {
    originalClear(internalWatchId);
    internalWatchId = null;
  }
  if (unsubscribeSensor) {
    unsubscribeSensor();
    unsubscribeSensor = null;
  }
}

function patchedWatchPosition(
  success: PositionCallback,
  error?: PositionErrorCallback | null,
  options?: PositionOptions,
): number {
  const virtualId = nextVirtualId++;
  pgWatches.set(virtualId, { success, error });
  ensureInternalWatch(options);
  return virtualId;
}

function patchedGetCurrentPosition(
  success: PositionCallback,
  error?: PositionErrorCallback | null,
  options?: PositionOptions,
): void {
  const { channelModes: modes, simValues: sim } = useSensorStore.getState();

  if (modes.position === 'sim' && sim.positionQuality === 'denied') {
    if (error) error(buildFakeDeniedError());
    return;
  }

  if (hasAnySim(modes) && sim.positionQuality === 'active') {
    if (modes.position === 'sim') {
      const fakePos = buildFakePos(sim);
      if (fakePos) {
        success(fakePos);
        return;
      }
    }
    if (lastRealPosition) {
      const mixed = mixValues(lastRealPosition, modes, sim);
      success(mixed);
      return;
    }
  }

  originalGetCurrent!(success, error ?? undefined, options);
}

function patchedClearWatch(id: number): void {
  pgWatches.delete(id);
  if (pgWatches.size === 0) {
    stopInternalWatch();
  }
}

export function installSimGeolocation(): void {
  if (installed) return;
  if (!navigator.geolocation) return;

  originalWatch = navigator.geolocation.watchPosition.bind(
    navigator.geolocation,
  );
  originalGetCurrent = navigator.geolocation.getCurrentPosition.bind(
    navigator.geolocation,
  );
  originalClear = navigator.geolocation.clearWatch.bind(
    navigator.geolocation,
  );

  navigator.geolocation.watchPosition = patchedWatchPosition;
  navigator.geolocation.getCurrentPosition = patchedGetCurrentPosition;
  navigator.geolocation.clearWatch = patchedClearWatch;

  installed = true;
}
