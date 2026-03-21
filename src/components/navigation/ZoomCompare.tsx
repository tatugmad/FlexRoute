import { useState, useEffect, useCallback } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export function ZoomCompare() {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(15);
  const [nativeOn, setNativeOn] = useState(false);

  useEffect(() => {
    if (!map) return;
    setCurrentZoom(map.getZoom() ?? 15);
    const listener = map.addListener("zoom_changed", () => {
      setCurrentZoom(map.getZoom() ?? 15);
    });
    return () => google.maps.event.removeListener(listener);
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

  const toggleNative = useCallback(() => {
    setNativeOn((prev) => {
      const next = !prev;
      (window as unknown as Record<string, unknown>).__googleZoomNative = next;
      return next;
    });
  }, []);

  return (
    <div className="absolute left-4 top-1/3 z-10 pointer-events-auto bg-white/90 rounded-xl shadow-lg p-2 text-xs space-y-2">
      <div className="text-center font-mono text-slate-500">
        zoom: {currentZoom.toFixed(2)}
      </div>

      <div className="space-y-1">
        <div className="text-center font-bold text-slate-700">setZoom</div>
        <div className="flex gap-1">
          <button
            onClick={handleSetZoomIn}
            className="px-3 py-1.5 bg-slate-200 rounded hover:bg-slate-300"
          >+</button>
          <button
            onClick={handleSetZoomOut}
            className="px-3 py-1.5 bg-slate-200 rounded hover:bg-slate-300"
          >-</button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-center font-bold text-slate-700">googlezoom</div>
        <button
          onClick={toggleNative}
          className={`w-full px-3 py-1.5 rounded font-bold ${
            nativeOn
              ? "bg-blue-500 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {nativeOn ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
