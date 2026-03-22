import { useRef, useCallback, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

const LONG_PRESS_DELAY = 200;
// [間隔ms, ステップ] の加速テーブル
// リピート回数に応じてフェーズが変わる
const ACCEL_PHASES = [
  { until: 5,  intervalMs: 80,  baseStep: 0.25 },
  { until: 15, intervalMs: 50,  baseStep: 0.4 },
  { until: Infinity, intervalMs: 30, baseStep: 0.5 },
] as const;

function zoomStepFactor(currentZoom: number, direction: 1 | -1): number {
  if (direction > 0) {
    if (currentZoom >= 18) return 0.3;
    if (currentZoom >= 15) return 0.5;
    if (currentZoom >= 10) return 0.8;
    return 1.0;
  } else {
    if (currentZoom <= 5) return 0.5;
    if (currentZoom <= 8) return 0.8;
    return 1.0;
  }
}

export function ZoomInOutButtons() {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepCountRef = useRef(0);
  const [modeLabel, setModeLabel] = useState("P");

  const applyZoom = useCallback(
    (direction: 1 | -1, step: number = 0.25) => {
      if (!map) return;
      const current = map.getZoom() ?? 15;
      const next = Math.max(1, Math.min(22, current + direction * step));
      if (next !== current) map.setZoom(next);
    },
    [map],
  );

  const startContinuous = useCallback(
    (direction: 1 | -1) => {
      stepCountRef.current = 0;
      const tick = () => {
        stepCountRef.current++;
        const phase = ACCEL_PHASES.find(
          (p) => stepCountRef.current <= p.until,
        ) ?? ACCEL_PHASES[ACCEL_PHASES.length - 1]!;
        const currentZoom = map?.getZoom() ?? 15;
        const effectiveStep = phase.baseStep * zoomStepFactor(currentZoom, direction);
        applyZoom(direction, effectiveStep);
        intervalRef.current = setTimeout(tick, phase.intervalMs);
      };
      timerRef.current = setTimeout(tick, LONG_PRESS_DELAY);
    },
    [applyZoom, map],
  );

  const stopContinuous = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearTimeout(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
    // Google Maps のアニメーションキューをキャンセルし、
    // 現在の表示ズームで即座に固定する
    if (map) {
      const currentZoom = map.getZoom();
      const currentCenter = map.getCenter();
      if (currentZoom != null && currentCenter) {
        (map as google.maps.Map).moveCamera({
          zoom: currentZoom,
          center: currentCenter,
        });
      }
    }
  }, [map]);

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
      <div className="border-t border-slate-200" />
      <button
        onClick={() => {
          const w = window as unknown as Record<string, unknown>;
          const isNative = w.__wheelMode === "native";
          w.__wheelMode = isNative ? undefined : "native";
          setModeLabel(isNative ? "P" : "N");
          if (map) {
            (map as google.maps.Map).setOptions({
              scrollwheel: !isNative ? true : false,
            });
          }
        }}
        className="w-10 h-10 flex items-center justify-center text-slate-600 text-sm font-bold hover:bg-slate-100 active:bg-slate-200 select-none"
        title="Wheel zoom: P=pivot-fine / N=native"
      >
        {modeLabel}
      </button>
    </div>
  );
}
