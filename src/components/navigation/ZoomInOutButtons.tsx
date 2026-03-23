import { useRef, useCallback, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { cameraController } from "@/services/cameraController";

const LONG_PRESS_DELAY = 200;
// リピート回数に応じてステップが大きくなる加速テーブル
const ACCEL_PHASES = [
  { until: 5,        baseStep: 0.25 },
  { until: 15,       baseStep: 0.4 },
  { until: Infinity, baseStep: 0.5 },
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
  const activeRef = useRef(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepCountRef = useRef(0);
  const [modeLabel, setModeLabel] = useState("P");

  const applyZoom = useCallback(
    (direction: 1 | -1, step: number = 0.25) => {
      const currentZoom = map?.getZoom() ?? 15;
      const effectiveStep = step * zoomStepFactor(currentZoom, direction);
      cameraController.zoomStep(direction, effectiveStep);
    },
    [map],
  );

  const startIdleChain = useCallback(
    (direction: 1 | -1) => {
      if (!map) return;
      activeRef.current = true;
      stepCountRef.current = 0;

      const onIdle = () => {
        if (!activeRef.current) return;
        stepCountRef.current++;
        const phase = ACCEL_PHASES.find(
          (p) => stepCountRef.current <= p.until,
        ) ?? ACCEL_PHASES[ACCEL_PHASES.length - 1]!;
        const currentZoom = map.getZoom() ?? 15;
        const effectiveStep = phase.baseStep * zoomStepFactor(currentZoom, direction);
        cameraController.zoomStep(direction, effectiveStep);
        google.maps.event.addListenerOnce(map, "idle", onIdle);
      };

      delayTimerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        onIdle();
      }, LONG_PRESS_DELAY);
    },
    [map],
  );

  const stopContinuous = useCallback(() => {
    activeRef.current = false;
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (direction: 1 | -1) => {
      applyZoom(direction);
      startIdleChain(direction);
    },
    [applyZoom, startIdleChain],
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
          const newMode = cameraController.toggleWheelMode();
          setModeLabel(newMode === "pivot" ? "P" : "N");
        }}
        className="w-10 h-10 flex items-center justify-center text-slate-600 text-sm font-bold hover:bg-slate-100 active:bg-slate-200 select-none"
        title="Wheel zoom: P=pivot-fine / N=native"
      >
        {modeLabel}
      </button>
    </div>
  );
}
