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

  // followMode=auto 時: ホイールズームの center ずれを防止 (D-035)
  useEffect(() => {
    if (!map) return;
    const zoomModeFlag = (window as unknown as Record<string, unknown>).__zoomMode;
    const isNative = zoomModeFlag === "native";
    const isAuto = followMode === "auto";
    const shouldDisableScrollwheel = isAuto && !isNative;
    (map as google.maps.Map).setOptions({ scrollwheel: !shouldDisableScrollwheel });
    // TEMP: scrollwheel 設定をログ
    console.log("[TEMP D-035] useEffect run:", {
      followMode,
      zoomModeFlag,
      isNative,
      shouldDisableScrollwheel,
      scrollwheelSetTo: !shouldDisableScrollwheel,
    });
    const div = (map as google.maps.Map).getDiv();
    if (!div) return;
    const handleWheel = (e: WheelEvent) => {
      const state = useNavigationStore.getState();
      const currentZoomMode = (window as unknown as Record<string, unknown>).__zoomMode;
      // TEMP: handleWheel 呼び出しを必ずログ（return 前に）
      const beforeZoom = map.getZoom() ?? 0;
      const centerBefore = map.getCenter();
      console.log("[TEMP D-035] handleWheel fired:", {
        followMode: state.followMode,
        zoomModeFlag: currentZoomMode,
        beforeZoom: beforeZoom.toFixed(4),
        centerBefore: centerBefore
          ? { lat: centerBefore.lat().toFixed(6), lng: centerBefore.lng().toFixed(6) }
          : null,
        deltaY: e.deltaY,
      });
      if (state.followMode !== "auto") {
        console.log("[TEMP D-035] → skipped: not auto"); // TEMP
        return;
      }
      if (currentZoomMode === "native") {
        console.log("[TEMP D-035] → skipped: native mode"); // TEMP
        return;
      }
      e.preventDefault();
      const currentZoom = map.getZoom() ?? 15;
      const delta = e.deltaY < 0 ? 1 : -1;
      const newZoom = Math.max(1, Math.min(22, currentZoom + delta));
      if (newZoom !== currentZoom) {
        map.setZoom(newZoom);
        // TEMP: setZoom 実行ログ
        console.log("[TEMP D-035] → setZoom called:", {
          from: currentZoom.toFixed(4),
          to: newZoom,
          delta,
        });
      }
    };
    div.addEventListener("wheel", handleWheel, { passive: false });
    // TEMP: Google Maps ネイティブズームの検知
    // zoom_changed は setZoom でもネイティブでも発火する
    // handleWheel の setZoom と同期的に発火するか、
    // それとも別タイミングで発火するかで判別できる
    let lastSetZoomTime = 0;
    const origSetZoom = map.setZoom.bind(map);
    (map as google.maps.Map).setZoom = ((z: number) => {
      lastSetZoomTime = performance.now();
      return origSetZoom(z);
    }) as typeof map.setZoom;
    const zoomListener = map.addListener("zoom_changed", () => {
      const elapsed = performance.now() - lastSetZoomTime;
      const zoom = map.getZoom() ?? 0;
      const center = map.getCenter();
      // TEMP: zoom_changed の発火元を判別
      console.log("[TEMP D-035] zoom_changed:", {
        zoom: zoom.toFixed(4),
        center: center
          ? { lat: center.lat().toFixed(6), lng: center.lng().toFixed(6) }
          : null,
        fromSetZoom: elapsed < 50,
        elapsedSinceSetZoom: Math.round(elapsed),
      });
    });
    return () => {
      div.removeEventListener("wheel", handleWheel);
      google.maps.event.removeListener(zoomListener); // TEMP
      (map as google.maps.Map).setZoom = origSetZoom; // TEMP: restore
      (map as google.maps.Map).setOptions({ scrollwheel: true });
    };
  }, [map, followMode]);

  return null;
}
