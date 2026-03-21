import { useRef, useCallback } from "react";
import { useMap } from "@vis.gl/react-google-maps";

const LONG_PRESS_DELAY = 400;
const INTERVALS = [300, 300, 300, 200, 200, 200, 100];

export function ZoomInOutButtons() {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepCountRef = useRef(0);

  const applyZoom = useCallback(
    (direction: 1 | -1) => {
      if (!map) return;
      const current = map.getZoom() ?? 15;
      const next = Math.max(1, Math.min(22, current + direction));
      if (next !== current) map.setZoom(next);
    },
    [map],
  );

  const startContinuous = useCallback(
    (direction: 1 | -1) => {
      stepCountRef.current = 0;
      const tick = () => {
        applyZoom(direction);
        stepCountRef.current++;
        const idx = Math.min(stepCountRef.current, INTERVALS.length - 1);
        intervalRef.current = setTimeout(tick, INTERVALS[idx]!);
      };
      timerRef.current = setTimeout(tick, LONG_PRESS_DELAY);
    },
    [applyZoom],
  );

  const stopContinuous = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearTimeout(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (direction: 1 | -1) => {
      applyZoom(direction);
      startContinuous(direction);
    },
    [applyZoom, startContinuous],
  );

  return (
    <div className="absolute left-4 bottom-20 z-10 pointer-events-auto bg-white/90 rounded-xl shadow-lg flex flex-col overflow-hidden">
      <button
        onPointerDown={() => handlePointerDown(1)}
        onPointerUp={stopContinuous}
        onPointerLeave={stopContinuous}
        className="w-10 h-10 flex items-center justify-center text-slate-600 text-lg font-bold hover:bg-slate-100 active:bg-slate-200 select-none"
      >
        +
      </button>
      <div className="border-t border-slate-200" />
      <button
        onPointerDown={() => handlePointerDown(-1)}
        onPointerUp={stopContinuous}
        onPointerLeave={stopContinuous}
        className="w-10 h-10 flex items-center justify-center text-slate-600 text-lg font-bold hover:bg-slate-100 active:bg-slate-200 select-none"
      >
        -
      </button>
    </div>
  );
}
