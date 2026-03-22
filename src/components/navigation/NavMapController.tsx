import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import normalizeWheel from "normalize-wheel";
import { useNavigationStore } from "@/stores/navigationStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

function getAutoZoom(speedKmh: number): number {
  if (speedKmh >= 80) return 13;
  if (speedKmh >= 30) return 15;
  return 17;
}

/**
 * followMode=auto 時のホイールズームで、マーカーをピボット（固定点）に
 * した小刻みズームを行う (D-035)。
 *
 * newCenter = marker + (oldCenter - marker) * 2^(oldZoom - newZoom)
 * により、マーカーの画面上のピクセル位置を不変に保つ。
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

  // followMode=auto 時: ホイールズームの center ずれを防止 (D-035)
  useEffect(() => {
    if (!map) return;
    const isAuto = followMode === "auto";
    const useNative = (window as unknown as Record<string, unknown>)
      .__wheelMode === "native";
    (map as google.maps.Map).setOptions({
      scrollwheel: !isAuto || useNative,
    });
    const div = (map as google.maps.Map).getDiv();
    if (!div) return;
    let wheelStopTimer: ReturnType<typeof setTimeout> | null = null;
    const handleWheel = (e: WheelEvent) => {
      const state = useNavigationStore.getState();
      if (state.followMode !== "auto") return;
      if ((window as unknown as Record<string, unknown>).__wheelMode === "native") return;
      e.preventDefault();
      const currentZoom = map.getZoom() ?? 15;
      const normalized = normalizeWheel(e);
      const step = Math.max(-1, Math.min(1, -normalized.pixelY / 400));
      const newZoom = Math.max(1, Math.min(22, currentZoom + step));
      if (newZoom === currentZoom) return;
      const marker = state.currentPosition;
      if (marker) {
        pivotZoom(map as google.maps.Map, marker, newZoom);
      } else {
        map.setZoom(newZoom);
      }
      // ホイール停止検知: 最後のホイールイベントから150ms後に
      // moveCamera で現在値に固定し、余韻をカットする
      if (wheelStopTimer) clearTimeout(wheelStopTimer);
      wheelStopTimer = setTimeout(() => {
        const z = map.getZoom();
        const c = map.getCenter();
        if (z != null && c) {
          (map as google.maps.Map).moveCamera({ zoom: z, center: c });
        }
        wheelStopTimer = null;
      }, 150);
    };
    div.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      div.removeEventListener("wheel", handleWheel);
      if (wheelStopTimer) clearTimeout(wheelStopTimer);
      (map as google.maps.Map).setOptions({ scrollwheel: true });
    };
  }, [map, followMode]);

  return null;
}
