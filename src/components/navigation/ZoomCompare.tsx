import { useState, useEffect, useCallback } from "react";
import { useMap } from "@vis.gl/react-google-maps";
type ZoomMode = "setzoom" | "native" | "pivot" | "pivot-fine";
export function ZoomCompare() {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(15);
  const [mode, setMode] = useState<ZoomMode>("setzoom");
  useEffect(() => {
    if (!map) return;
    setCurrentZoom(map.getZoom() ?? 15);
    const listener = map.addListener("zoom_changed", () => {
      setCurrentZoom(map.getZoom() ?? 15);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);
  const changeMode = useCallback((newMode: ZoomMode) => {
    setMode(newMode);
    (window as unknown as Record<string, unknown>).__zoomMode = newMode;
    if (map) {
      // native のみ Google Maps のネイティブ wheel ズームを有効にする
      (map as google.maps.Map).setOptions({
        scrollwheel: newMode === "native",
      });
    }
  }, [map]);
  const handleSetZoomIn = useCallback(() => {
    if (!map) return;
    const z = map.getZoom() ?? 15;
    map.setZoom(Math.min(22, Math.round(z) + 1));
  }, [map]);
  const handleSetZoomOut = useCallback(() => {
    if (!map) return;
    const z = map.getZoom() ?? 15;
    map.setZoom(Math.max(1, Math.round(z) - 1));
  }, [map]);
  const btnBase = "px-1.5 py-1 rounded text-[10px] font-bold";
  const btnActive = "bg-blue-500 text-white";
  const btnInactive = "bg-slate-200 text-slate-700 hover:bg-slate-300";
  return (
    <div className="absolute left-4 top-1/3 z-10 pointer-events-auto bg-white/90 rounded-xl shadow-lg p-2 text-xs space-y-2 w-44">
      <div className="text-center font-mono text-slate-500">
        zoom: {currentZoom.toFixed(2)}
      </div>
      <div className="text-center font-bold text-slate-700 text-[10px]">
        wheel mode
      </div>
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => changeMode("setzoom")}
          className={`${btnBase} ${mode === "setzoom" ? btnActive : btnInactive}`}
        >
          setZoom
        </button>
        <button
          onClick={() => changeMode("native")}
          className={`${btnBase} ${mode === "native" ? btnActive : btnInactive}`}
        >
          native
        </button>
        <button
          onClick={() => changeMode("pivot")}
          className={`${btnBase} ${mode === "pivot" ? btnActive : btnInactive}`}
        >
          pivot
        </button>
        <button
          onClick={() => changeMode("pivot-fine")}
          className={`${btnBase} ${mode === "pivot-fine" ? btnActive : btnInactive}`}
        >
          pivot-fine
        </button>
      </div>
      <div className="border-t border-slate-200 pt-2">
        <div className="text-center font-bold text-slate-700 text-[10px]">
          manual setZoom
        </div>
        <div className="flex gap-1 mt-1">
          <button
            onClick={handleSetZoomIn}
            className={`flex-1 ${btnBase} ${btnInactive}`}
          >+1</button>
          <button
            onClick={handleSetZoomOut}
            className={`flex-1 ${btnBase} ${btnInactive}`}
          >-1</button>
        </div>
      </div>
    </div>
  );
}
