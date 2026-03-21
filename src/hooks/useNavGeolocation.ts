import { useEffect, useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLostTimer } from "@/hooks/useLostTimer";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

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
    if (!navigator.geolocation) {
      fr.error(C.GPS, "gps.notSupported", {});
      return;
    }

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
      fr.trace(C.GPS, "gps.position", {
        lat: position.lat, lng: position.lng,
        heading, speed, accuracy,
      });
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
            fr.info(C.GPS, "gps.deniedRecovered", {});
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
        fr.warn(C.GPS, "gps.denied", {});
      } else {
        setLost();
        fr.warn(C.GPS, "gps.error", { code: error.code, message: error.message });
      }
    };

    startWatch();
    resetLostTimer();
    fr.debug(C.GPS, "gps.watchStarted", {});

    return () => {
      fr.debug(C.GPS, "gps.watchStopped", {});
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
        } catch (err) {
          fr.warn(C.GPS, "gps.lastKnownSaveFailed", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    };
  }, [setCurrentPosition]);
}
