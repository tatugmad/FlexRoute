import { useState, useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";

export function ZoomDebugOverlay() {
  const map = useMap();
  const [zoom, setZoom] = useState(15);
  const zoomMode = useNavigationStore((s) => s.zoomMode);
  const speed = useNavigationStore((s) => s.speed);

  useEffect(() => {
    if (!map) return;
    setZoom(map.getZoom() ?? 15);
    const listener = map.addListener("zoom_changed", () => {
      setZoom(map.getZoom() ?? 15);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  const speedKmh = Math.round(speed * 3.6);
  const modeLabel = zoomMode === "autoZoom" ? "AUTO" : "LOCK";

  return (
    <div className="absolute right-4 bottom-36 z-10 bg-black/70 text-white text-xs rounded px-2 py-1 font-mono">
      z{zoom.toFixed(1)} {modeLabel} {speedKmh}km/h
    </div>
  );
}
