import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

function getAutoZoom(speedKmh: number): number {
  if (speedKmh >= 80) return 13;
  if (speedKmh >= 30) return 15;
  return 17;
}

export function NavMapController() {
  const map = useMap();
  const followMode = useNavigationStore((s) => s.followMode);
  const zoomMode = useNavigationStore((s) => s.zoomMode);
  const currentPosition = useNavigationStore((s) => s.currentPosition);
  const speed = useNavigationStore((s) => s.speed);
  const setFollowMode = useNavigationStore((s) => s.setFollowMode);
  const setZoomMode = useNavigationStore((s) => s.setZoomMode);
  const isAutoZoomingRef = useRef(false);

  // Detect user drag → switch to free mode
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("dragstart", () => {
      if (useNavigationStore.getState().followMode === "auto") {
        setFollowMode("free");
        fr.debug(C.NAV, "nav.dragToFree", {});
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, setFollowMode]);

  // Detect user zoom → switch to lockedZoom
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("zoom_changed", () => {
      if (isAutoZoomingRef.current) {
        isAutoZoomingRef.current = false;
        return;
      }
      if (useNavigationStore.getState().zoomMode === "autoZoom") {
        setZoomMode("lockedZoom");
        fr.debug(C.NAV, "nav.zoomToLocked", {});
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, setZoomMode]);

  // Auto-follow: pan to position + auto-zoom
  useEffect(() => {
    if (!map || followMode !== "auto" || !currentPosition) return;

    map.panTo(currentPosition);

    if (zoomMode === "autoZoom") {
      const speedKmh = (speed ?? 0) * 3.6;
      const targetZoom = getAutoZoom(speedKmh);
      const currentZoom = map.getZoom() ?? 15;
      if (Math.abs(currentZoom - targetZoom) >= 1) {
        isAutoZoomingRef.current = true;
        map.setZoom(targetZoom);
      }
    }
  }, [map, followMode, currentPosition, zoomMode, speed]);

  return null;
}
