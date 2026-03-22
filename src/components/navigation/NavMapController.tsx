import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAutoZoom } from "@/hooks/useAutoZoom";
import { shortestDelta } from "@/utils/headingUtils";
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
  const heading = useNavigationStore((s) => s.heading);
  const headingMode = useNavigationStore((s) => s.headingMode);
  const setFollowMode = useNavigationStore((s) => s.setFollowMode);
  const setZoomMode = useNavigationStore((s) => s.setZoomMode);
  const isAutoZoomingRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const prevHeadingRef = useRef(0);

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
      if (Date.now() - mountedAtRef.current < 2000) return;
      if (useNavigationStore.getState().zoomMode === "autoZoom") {
        setZoomMode("lockedZoom");
        fr.debug(C.NAV, "nav.zoomToLocked", {});
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, setZoomMode]);

  // D-032: moveCamera で center + heading + zoom を一括適用
  useEffect(() => {
    if (!map || followMode !== "auto" || !currentPosition) return;

    // free → auto 復帰時: 地図の実際の heading に同期
    const actualHeading = map.getHeading() ?? 0;
    if (Math.abs(shortestDelta(prevHeadingRef.current, actualHeading)) > 10) {
      prevHeadingRef.current = actualHeading;
    }

    // heading 算出
    const rawHeading = headingMode === "headingUp" ? heading : 0;
    const delta = shortestDelta(prevHeadingRef.current, rawHeading);
    prevHeadingRef.current += delta;
    const mapHeading = prevHeadingRef.current;

    // カメラオプション構築
    const cameraOptions: google.maps.CameraOptions = {
      center: currentPosition,
      heading: mapHeading,
    };

    // autoZoom 適用
    if (zoomMode === "autoZoom" && targetZoom !== null) {
      const currentZoom = map.getZoom() ?? 15;
      if (Math.abs(currentZoom - targetZoom) >= AUTO_ZOOM_THRESHOLD) {
        isAutoZoomingRef.current = true;
        cameraOptions.zoom = targetZoom;
      }
    }

    map.moveCamera(cameraOptions);
  }, [map, followMode, currentPosition, headingMode, heading, zoomMode, targetZoom]);

  return null;
}
