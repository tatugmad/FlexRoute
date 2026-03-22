import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAutoZoom } from "@/hooks/useAutoZoom";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

const AUTO_ZOOM_THRESHOLD = 0.3;

/**
 * followMode=auto 時のホイールズームで、マーカーをピボット（固定点）に
 * した小刻みズームを行う (D-035)。
 */
export function pivotZoom(
  map: google.maps.Map,
  marker: { lat: number; lng: number },
  newZoom: number,
): void {
  const currentZoom = map.getZoom() ?? 15;
  const center = map.getCenter();
  if (!center) {
    map.setZoom(newZoom);
    return;
  }
  const scale = Math.pow(2, currentZoom - newZoom);
  const newLat = marker.lat + (center.lat() - marker.lat) * scale;
  const newLng = marker.lng + (center.lng() - marker.lng) * scale;
  map.setZoom(newZoom);
  map.setCenter({ lat: newLat, lng: newLng });
}

export function NavMapController() {
  const map = useMap();
  const followMode = useNavigationStore((s) => s.followMode);
  const zoomMode = useNavigationStore((s) => s.zoomMode);
  const currentPosition = useNavigationStore((s) => s.currentPosition);
  const setFollowMode = useNavigationStore((s) => s.setFollowMode);
  const setZoomMode = useNavigationStore((s) => s.setZoomMode);
  const isAutoZoomingRef = useRef(false);

  const targetZoom = useAutoZoom();

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

  // Auto-follow: pan to position
  useEffect(() => {
    if (!map || followMode !== "auto" || !currentPosition) return;
    map.panTo(currentPosition);
  }, [map, followMode, currentPosition]);

  // Apply auto-zoom from useAutoZoom
  useEffect(() => {
    if (!map || followMode !== "auto" || zoomMode !== "autoZoom") return;
    if (targetZoom === null) return;
    const currentZoom = map.getZoom() ?? 15;
    if (Math.abs(currentZoom - targetZoom) < AUTO_ZOOM_THRESHOLD) return;
    isAutoZoomingRef.current = true;
    map.setZoom(targetZoom);
  }, [map, followMode, zoomMode, targetZoom]);

  return null;
}
