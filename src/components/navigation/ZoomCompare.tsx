import { useState, useEffect, useCallback } from "react";
import { useMap } from "@vis.gl/react-google-maps";

type ZoomMode = "setzoom" | "native";

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
    // NavMapController の useEffect は __zoomMode 変更で再実行されないので
    // ここで直接 scrollwheel を切り替える
    if (map) {
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

  const btnBase = "px-2 py-1 rounded text-xs font-bold";
  const btnActive = "bg-blue-500 text-white";
  const btnInactive = "bg-slate-200 text-slate-700 hover:bg-slate-300";

  return (
    <div className="absolute left-4 top-1/3 z-10 pointer-events-auto bg-white/90 rounded-xl shadow-lg p-2 text-xs space-y-2 w-36">
      <div className="text-center font-mono text-slate-500">
        zoom: {currentZoom.toFixed(2)}
      </div>
      <div className="text-center font-bold text-slate-700 text-[10px]">
        wheel mode
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => changeMode("setzoom")}
          className={`flex-1 ${btnBase} ${mode === "setzoom" ? btnActive : btnInactive}`}
        >
          setZoom
        </button>
        <button
          onClick={() => changeMode("native")}
          className={`flex-1 ${btnBase} ${mode === "native" ? btnActive : btnInactive}`}
        >
          native
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
