import { useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";

const DEFAULT_LOST_MS = 15000;
const MIN_LOST_MS = 10000;
const MAX_LOST_MS = 120000;
const RING_BUFFER_SIZE = 10;

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

export function useLostTimer() {
  const lostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number | null>(null);
  const intervalsRef = useRef<number[]>([]);

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

  const clearLostTimer = () => {
    if (lostTimerRef.current) clearTimeout(lostTimerRef.current);
    lostTimerRef.current = null;
  };

  const resetIntervals = () => {
    intervalsRef.current = [];
    lastUpdateRef.current = null;
  };

  return {
    lostTimerRef,
    setLost,
    setActive,
    resetLostTimer,
    recordInterval,
    clearLostTimer,
    resetIntervals,
  };
}
