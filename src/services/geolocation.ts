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
