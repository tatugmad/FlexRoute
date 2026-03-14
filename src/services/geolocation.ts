export type GeolocationResult = {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
};

export type GeolocationErrorInfo = {
  code: number;
  message: string;
};

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export function watchCurrentPosition(
  onSuccess: (result: GeolocationResult) => void,
  onError: (error: GeolocationErrorInfo) => void,
): number {
  if (!navigator.geolocation) {
    onError({ code: 0, message: "Geolocation is not supported" });
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      onError({ code: error.code, message: getErrorMessage(error.code) });
    },
    WATCH_OPTIONS,
  );
}

export function clearPositionWatch(watchId: number): void {
  if (watchId >= 0) {
    navigator.geolocation.clearWatch(watchId);
  }
}

// ── 2系統並走 ──

export type DualWatchCallbacks = {
  onPrimary: (result: GeolocationResult) => void;
  onSecondary: (result: GeolocationResult) => void;
  onPrimaryError: (error: GeolocationErrorInfo) => void;
  onSecondaryError: (error: GeolocationErrorInfo) => void;
};

const PRIMARY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

const SECONDARY_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 30000,
};

export function startDualWatch(
  callbacks: DualWatchCallbacks,
): { primaryId: number; secondaryId: number } {
  if (!navigator.geolocation) {
    const err = { code: 0, message: "Geolocation is not supported" };
    callbacks.onPrimaryError(err);
    callbacks.onSecondaryError(err);
    return { primaryId: -1, secondaryId: -1 };
  }

  const toResult = (p: GeolocationPosition): GeolocationResult => ({
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    heading: p.coords.heading,
    speed: p.coords.speed,
    accuracy: p.coords.accuracy,
  });

  const toError = (e: GeolocationPositionError): GeolocationErrorInfo => ({
    code: e.code,
    message: getErrorMessage(e.code),
  });

  const primaryId = navigator.geolocation.watchPosition(
    (pos) => callbacks.onPrimary(toResult(pos)),
    (err) => callbacks.onPrimaryError(toError(err)),
    PRIMARY_OPTIONS,
  );

  const secondaryId = navigator.geolocation.watchPosition(
    (pos) => callbacks.onSecondary(toResult(pos)),
    (err) => callbacks.onSecondaryError(toError(err)),
    SECONDARY_OPTIONS,
  );

  return { primaryId, secondaryId };
}

export function stopDualWatch(ids: { primaryId: number; secondaryId: number }): void {
  clearPositionWatch(ids.primaryId);
  clearPositionWatch(ids.secondaryId);
}

function getErrorMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return "位置情報の使用が許可されていません";
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return "位置情報を取得できません";
    case GeolocationPositionError.TIMEOUT:
      return "位置情報の取得がタイムアウトしました";
    default:
      return "位置情報の取得に失敗しました";
  }
}
