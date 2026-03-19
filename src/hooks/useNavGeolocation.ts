import { useEffect, useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";

const DEFAULT_LOST_MS = 15000;
const MIN_LOST_MS = 10000;
const MAX_LOST_MS = 120000;
const RING_BUFFER_SIZE = 10;
const DENIED_RETRY_MS = 5000;
const LAST_POSITION_KEY = "flexroute:lastKnownPosition";

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function computeLostThreshold(intervals: number[]): number {
  if (intervals.length < RING_BUFFER_SIZE) return DEFAULT_LOST_MS;
  const median = computeMedian(intervals);
  return Math.min(MAX_LOST_MS, Math.max(MIN_LOST_MS, median * 3));
}

export function useNavGeolocation() {
  const setCurrentPosition = useNavigationStore((s) => s.setCurrentPosition);
  const lostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastUpdateRef = useRef<number | null>(null);
  const intervalsRef = useRef<number[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const deniedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    intervalsRef.current = [];
    lastUpdateRef.current = null;

    const setLost = () => {
      useNavigationStore.setState({
        positionQuality: "lost",
        lostSince: new Date().toISOString(),
      });
    };

    const setActive = () => {
      useNavigationStore.setState({
        positionQuality: "active",
        lostSince: null,
      });
    };

    const resetLostTimer = () => {
      if (lostTimerRef.current) clearTimeout(lostTimerRef.current);
      const threshold = computeLostThreshold(intervalsRef.current);
      lostTimerRef.current = setTimeout(setLost, threshold);
    };

    const recordInterval = () => {
      const now = Date.now();
      if (lastUpdateRef.current !== null) {
        const delta = now - lastUpdateRef.current;
        if (intervalsRef.current.length >= RING_BUFFER_SIZE) {
          intervalsRef.current.shift();
        }
        intervalsRef.current.push(delta);
      }
      lastUpdateRef.current = now;
    };

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

    const handleError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        useNavigationStore.setState({
          positionQuality: "denied",
          lostSince: null,
        });
        if (lostTimerRef.current) clearTimeout(lostTimerRef.current);
        lostTimerRef.current = null;
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        startDeniedRetry();
      } else {
        setLost();
      }
    };

    const startWatch = () => {
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

    startWatch();
    resetLostTimer();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (lostTimerRef.current) clearTimeout(lostTimerRef.current);
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
