import { useCallback, useEffect, useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLostTimer } from "@/hooks/useLostTimer";
import { createWrapperCallback, useSimSubscription } from "@/hooks/useSimWatch";

const DENIED_RETRY_MS = 5000;
const LAST_POSITION_KEY = "flexroute:lastKnownPosition";

export function useNavGeolocation() {
  const setCurrentPosition = useNavigationStore((s) => s.setCurrentPosition);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const deniedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlePositionRef = useRef<((pos: GeolocationPosition) => void) | null>(null);

  const {
    setLost,
    setActive,
    resetLostTimer,
    recordInterval,
    clearLostTimer,
    resetIntervals,
  } = useLostTimer();

  const startWatchReal = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePositionRef.current?.(pos),
      handleErrorRef.current!,
      { enableHighAccuracy: true, maximumAge: 0 },
    );
  }, []);

  const startWatchSim = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    const wrapper = createWrapperCallback((pos) => handlePositionRef.current?.(pos));
    watchIdRef.current = navigator.geolocation.watchPosition(
      wrapper,
      handleErrorRef.current!,
      { enableHighAccuracy: true, maximumAge: 0 },
    );
  }, []);

  const handleErrorRef = useRef<((error: GeolocationPositionError) => void) | null>(null);

  useSimSubscription(handlePositionRef, startWatchReal, startWatchSim, setLost);

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

    handlePositionRef.current = handlePosition;

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
            startWatchReal();
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
        useNavigationStore.setState({ positionQuality: "denied", lostSince: null });
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

    handleErrorRef.current = handleError;

    // 初期起動: 常に real で開始
    startWatchReal();
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
        } catch { /* ignore quota errors */ }
      }
    };
  }, [setCurrentPosition]);
}
