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

const FAST_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 30000,
};

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/** 地図の初期センタリング専用。マーカーは出さない。 */
export function getCurrentPositionFast(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 0, message: "Geolocation is not supported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject({ code: error.code, message: getErrorMessage(error.code) });
      },
      FAST_OPTIONS,
    );
  });
}

/** 高精度位置監視。現在地マーカー・ナビ用。 */
export function watchHighAccuracy(
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
    HIGH_ACCURACY_OPTIONS,
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
