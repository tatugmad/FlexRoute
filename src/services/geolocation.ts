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

const LAST_KNOWN_POSITION_KEY = "flexroute:lastKnownPosition";

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/** lastKnownPosition を localStorage に保存 */
export function saveLastKnownPosition(lat: number, lng: number): void {
  const data = { lat, lng, updatedAt: new Date().toISOString() };
  localStorage.setItem(LAST_KNOWN_POSITION_KEY, JSON.stringify(data));
}

/** lastKnownPosition を localStorage から読み込み */
export function getLastKnownPosition(): {
  lat: number;
  lng: number;
  updatedAt: string;
} | null {
  try {
    const raw = localStorage.getItem(LAST_KNOWN_POSITION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.lat !== "number" || typeof data.lng !== "number") {
      return null;
    }
    return data;
  } catch {
    return null;
  }
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
