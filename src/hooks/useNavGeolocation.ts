import { useEffect, useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";

const LOST_TIMEOUT_MS = 15000;
const LAST_POSITION_KEY = "flexroute:lastKnownPosition";

export function useNavGeolocation() {
  const setCurrentPosition = useNavigationStore((s) => s.setCurrentPosition);
  const lostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const resetLostTimer = () => {
      if (lostTimerRef.current) clearTimeout(lostTimerRef.current);
      lostTimerRef.current = setTimeout(() => {
        useNavigationStore.setState({ positionQuality: "lost" });
      }, LOST_TIMEOUT_MS);
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const heading = pos.coords.heading ?? 0;
        const speed = pos.coords.speed ?? 0;
        const accuracy = pos.coords.accuracy ?? null;
        lastPositionRef.current = position;
        setCurrentPosition(position, heading, speed, "active", accuracy);
        resetLostTimer();
      },
      () => {
        useNavigationStore.setState({ positionQuality: "lost" });
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );

    resetLostTimer();

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (lostTimerRef.current) clearTimeout(lostTimerRef.current);
      if (lastPositionRef.current) {
        try {
          localStorage.setItem(
            LAST_POSITION_KEY,
            JSON.stringify({
              lat: lastPositionRef.current.lat,
              lng: lastPositionRef.current.lng,
              updatedAt: new Date().toISOString(),
            }),
          );
        } catch { /* ignore quota errors */ }
      }
    };
  }, [setCurrentPosition]);
}
