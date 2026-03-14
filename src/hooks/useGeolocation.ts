import { useEffect, useRef, useState } from "react";

import { watchHighAccuracy, clearPositionWatch } from "@/services/geolocation";
import { logService } from "@/services/logService";
import { useNavigationStore } from "@/stores/navigationStore";
import type { LatLng, PositionQuality } from "@/types";

const LOST_THRESHOLD = 15000;
const CHECK_INTERVAL = 1000;

type GeolocationState = {
  position: LatLng | null;
  heading: number;
  speed: number;
  quality: PositionQuality;
  accuracy: number | null;
  error: string | null;
};

export function useGeolocation(): GeolocationState {
  const setCurrentPosition = useNavigationStore((s) => s.setCurrentPosition);
  const [state, setState] = useState<GeolocationState>({
    position: null,
    heading: 0,
    speed: 0,
    quality: "lost",
    accuracy: null,
    error: null,
  });

  const lastResultAt = useRef(0);

  useEffect(() => {
    const watchId = watchHighAccuracy(
      (result) => {
        lastResultAt.current = Date.now();
        const pos: LatLng = { lat: result.lat, lng: result.lng };
        const heading = result.heading ?? 0;
        const speed = result.speed ?? 0;
        const accuracy = result.accuracy;

        setCurrentPosition(pos, heading, speed, "active", accuracy);
        setState({ position: pos, heading, speed, quality: "active", accuracy, error: null });
      },
      (err) => {
        logService.error("GEO", "位置取得エラー", err);
        setState((prev) => ({ ...prev, error: err.message }));
      },
    );

    const timer = setInterval(() => {
      const now = Date.now();
      if (lastResultAt.current > 0 && now - lastResultAt.current >= LOST_THRESHOLD) {
        const currentPos = useNavigationStore.getState().currentPosition;
        if (currentPos) {
          setCurrentPosition(currentPos, 0, 0, "lost", null);
        }
        setState((prev) => ({ ...prev, quality: "lost", accuracy: null }));
      }
    }, CHECK_INTERVAL);

    return () => {
      clearPositionWatch(watchId);
      clearInterval(timer);
    };
  }, [setCurrentPosition]);

  return state;
}
