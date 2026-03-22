import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAutoZoom } from "@/hooks/useAutoZoom";
import { shortestDelta } from "@/utils/headingUtils";
import { computeEdgeFollow } from "@/utils/edgeFollow";
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

  // D-032 + D-036: moveCamera による統合カメラ制御（auto / free 分岐）
  useEffect(() => {
    if (!map || !currentPosition) return;

    // auto 復帰時: 地図の実際の heading に同期
    if (followMode === "auto") {
      const actualHeading = map.getHeading() ?? 0;
      if (Math.abs(shortestDelta(prevHeadingRef.current, actualHeading)) > 10) {
        prevHeadingRef.current = actualHeading;
      }
    }

    // heading 算出（auto / free 共通）
    const rawHeading = headingMode === "headingUp" ? heading : 0;
    const delta = shortestDelta(prevHeadingRef.current, rawHeading);
    prevHeadingRef.current += delta;
    const mapHeading = prevHeadingRef.current;

    if (followMode === "auto") {
      // --- auto モード: center + heading + zoom ---
      const cameraOptions: google.maps.CameraOptions = {
        center: currentPosition,
        heading: mapHeading,
      };
      if (zoomMode === "autoZoom" && targetZoom !== null) {
        const currentZoom = map.getZoom() ?? 15;
        if (Math.abs(currentZoom - targetZoom) >= AUTO_ZOOM_THRESHOLD) {
          isAutoZoomingRef.current = true;
          cameraOptions.zoom = targetZoom;
        }
      }
      map.moveCamera(cameraOptions);
    } else {
      // --- free モード (D-036) ---
      const cameraOptions: google.maps.CameraOptions = {};
      // headingUp なら heading を適用
      if (headingMode === "headingUp") {
        cameraOptions.heading = mapHeading;
      }
      // エッジ追従: マーカーが画面端に接近したらスクロール
      const edgeCenter = computeEdgeFollow(map, currentPosition, mapHeading);
      if (edgeCenter) {
        cameraOptions.center = edgeCenter;
      }
      if (cameraOptions.heading !== undefined || cameraOptions.center !== undefined) {
        map.moveCamera(cameraOptions);
      }
    }
  }, [map, followMode, currentPosition, headingMode, heading, zoomMode, targetZoom]);

  return null;
}
