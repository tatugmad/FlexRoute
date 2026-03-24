import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { cameraController } from "@/services/cameraController";

/**
 * D-037: store → cameraController.onPositionUpdate の 1 行ブリッジ。
 */
export function NavCameraSync() {
  const map = useMap();
  const position = useNavigationStore((s) => s.currentPosition);
  const heading = useNavigationStore((s) => s.heading);
  const speed = useNavigationStore((s) => s.speed);

  useEffect(() => {
    if (!map) return;
    cameraController.init(map as google.maps.Map);
    return () => cameraController.dispose();
  }, [map]);

  useEffect(() => {
    if (!position) return;
    cameraController.onPositionUpdate(position, heading, speed ?? 0);
  }, [position, heading, speed]);

  return null;
}
