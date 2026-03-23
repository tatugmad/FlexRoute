import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAutoZoom } from "@/hooks/useAutoZoom";
import { cameraController } from "@/services/cameraController";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

/**
 * D-037: navigationStore → cameraController への橋渡し。
 * ドラッグ検知による followMode 遷移、zoom_changed によるズームモード遷移。
 */
export function NavCameraSync() {
  const map = useMap();
  const followMode = useNavigationStore((s) => s.followMode);
  const zoomMode = useNavigationStore((s) => s.zoomMode);
  const currentPosition = useNavigationStore((s) => s.currentPosition);
  const heading = useNavigationStore((s) => s.heading);
  const headingMode = useNavigationStore((s) => s.headingMode);
  const setFollowMode = useNavigationStore((s) => s.setFollowMode);
  const setZoomMode = useNavigationStore((s) => s.setZoomMode);
  const mountedAtRef = useRef(Date.now());

  const targetZoom = useAutoZoom();

  // Lifecycle: init / dispose
  useEffect(() => {
    if (!map) return;
    cameraController.init(map as google.maps.Map);
    return () => cameraController.dispose();
  }, [map]);

  // Detect user drag → switch to free mode
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("dragstart", () => {
      cameraController.onDragStart();
      if (useNavigationStore.getState().followMode === "auto") {
        setFollowMode("free");
        fr.debug(C.NAV, "nav.dragToFree", {});
      }
    });
    const dragEndListener = map.addListener("dragend", () => {
      cameraController.onDragEnd();
    });
    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.removeListener(dragEndListener);
    };
  }, [map, setFollowMode]);

  // Detect user zoom → switch to lockedZoom
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("zoom_changed", () => {
      if (cameraController.consumeAutoZoomFlag()) return;
      if (Date.now() - mountedAtRef.current < 2000) return;
      if (useNavigationStore.getState().zoomMode === "autoZoom") {
        setZoomMode("lockedZoom");
        fr.debug(C.NAV, "nav.zoomToLocked", {});
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, setZoomMode]);

  // D-032 + D-036 + D-037: cameraController による統合カメラ制御
  useEffect(() => {
    if (!map || !currentPosition) return;
    const rawHeading = headingMode === "headingUp" ? heading : 0;

    if (followMode === "auto") {
      cameraController.syncHeadingFromMap();
      cameraController.updateAutoCamera(
        currentPosition,
        rawHeading,
        zoomMode === "autoZoom" ? targetZoom : null,
      );
    } else {
      cameraController.updateFreeCamera(currentPosition, rawHeading);
    }
  }, [map, followMode, currentPosition, headingMode, heading, zoomMode, targetZoom]);

  return null;
}
