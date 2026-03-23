import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import normalizeWheel from "normalize-wheel";
import { useNavigationStore } from "@/stores/navigationStore";
import { cameraController } from "@/services/cameraController";

/**
 * followMode=auto 時: ホイールズームの center ずれを防止 (D-035, D-037)
 * cameraController に委譲する軽量コンポーネント。
 */
export function NavWheelZoom() {
  const map = useMap();
  const followMode = useNavigationStore((s) => s.followMode);

  useEffect(() => {
    if (!map) return;
    cameraController.updateScrollwheel();

    const div = (map as google.maps.Map).getDiv();
    if (!div) return;
    let wheelStopTimer: ReturnType<typeof setTimeout> | null = null;
    const handleWheel = (e: WheelEvent) => {
      const normalized = normalizeWheel(e);
      if (!cameraController.wheelZoom(normalized.pixelY)) return;
      e.preventDefault();
      if (wheelStopTimer) clearTimeout(wheelStopTimer);
      wheelStopTimer = setTimeout(() => {
        cameraController.snapCamera();
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
