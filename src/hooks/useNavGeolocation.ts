import { useEffect, useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLostTimer } from "@/hooks/useLostTimer";

const DENIED_RETRY_MS = 5000;
const LAST_POSITION_KEY = "flexroute:lastKnownPosition";

export function useNavGeolocation() {
  const setCurrentPosition = useNavigationStore((s) => s.setCurrentPosition);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const deniedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    setLost,
    setActive,
    resetLostTimer,
    recordInterval,
    clearLostTimer,
    resetIntervals,
  } = useLostTimer();

  useEffect(() => {
    if (!navigator.geolocation) return;

    resetIntervals();

    const handlePosition = (pos: GeolocationPosition) => {
      const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const heading = pos.coords.heading ?? 0;
      const speed = pos.coords.speed ?? 0;
      const accuracy = pos.coords.accuracy ?? null;
      lastPositionRef.current = position;
      recordInterval();
      setCurrentPosition(position, heading, speed, "active", accuracy);
      setActive();
      resetLostTimer();
    };

    const startWatch = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: true, maximumAge: 0 },
      );
    };

    const startDeniedRetry = () => {
      if (deniedIntervalRef.current) return;
      deniedIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (deniedIntervalRef.current) {
              clearInterval(deniedIntervalRef.current);
              deniedIntervalRef.current = null;
            }
            handlePosition(pos);
            startWatch();
          },
          (err) => {
            if (err.code !== err.PERMISSION_DENIED) {
              // Non-permission error: keep retrying
            }
          },
          { enableHighAccuracy: true, maximumAge: 0 },
        );
      }, DENIED_RETRY_MS);
    };

    const handleError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        useNavigationStore.setState({
          positionQuality: "denied",
          lostSince: null,
        });
        clearLostTimer();
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        startDeniedRetry();
      } else {
        setLost();
      }
    };

    startWatch();
    resetLostTimer();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearLostTimer();
      if (deniedIntervalRef.current) {
        clearInterval(deniedIntervalRef.current);
        deniedIntervalRef.current = null;
      }
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
        } catch {
          /* ignore quota errors */
        }
      }
    };
  }, [setCurrentPosition]);
}
