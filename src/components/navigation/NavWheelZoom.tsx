import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import normalizeWheel from "normalize-wheel";
import { useNavigationStore } from "@/stores/navigationStore";
import { pivotZoom } from "@/components/navigation/NavMapController";

/**
 * followMode=auto 時: ホイールズームの center ずれを防止 (D-035)
 * NavMapController から抽出したコンポーネント。
 */
export function NavWheelZoom() {
  const map = useMap();
  const followMode = useNavigationStore((s) => s.followMode);

  useEffect(() => {
    if (!map) return;
    const isAuto = followMode === "auto";
    const useNative = (window as unknown as Record<string, unknown>)
      .__wheelMode === "native";
    (map as google.maps.Map).setOptions({
      scrollwheel: !isAuto || useNative,
    });
    const onWheelModeChanged = () => {
      const native = (window as unknown as Record<string, unknown>)
        .__wheelMode === "native";
      const auto = useNavigationStore.getState().followMode === "auto";
      (map as google.maps.Map).setOptions({ scrollwheel: !auto || native });
    };
    window.addEventListener("wheelmode-changed", onWheelModeChanged);

    const div = (map as google.maps.Map).getDiv();
    if (!div) return;
    let wheelStopTimer: ReturnType<typeof setTimeout> | null = null;
    const handleWheel = (e: WheelEvent) => {
      const state = useNavigationStore.getState();
      if (state.followMode !== "auto") return;
      if (
        (window as unknown as Record<string, unknown>).__wheelMode === "native"
      )
        return;
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
      window.removeEventListener("wheelmode-changed", onWheelModeChanged);
      div.removeEventListener("wheel", handleWheel);
      if (wheelStopTimer) clearTimeout(wheelStopTimer);
      (map as google.maps.Map).setOptions({ scrollwheel: true });
    };
  }, [map, followMode]);

  return null;
}
