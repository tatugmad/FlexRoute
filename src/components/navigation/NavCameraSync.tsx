import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRouteSnap } from "@/hooks/useRouteSnap";
import { cameraController } from "@/services/cameraController";

/**
 * D-037: store → cameraController.onPositionUpdate の 1 行ブリッジ。
 * カメラ中心にはスナップ後座標を使用し、画面中央固定マーカーとの一致を保つ。
 */
export function NavCameraSync() {
  const map = useMap();
  const position = useNavigationStore((s) => s.currentPosition);
  const heading = useNavigationStore((s) => s.heading);
  const speed = useNavigationStore((s) => s.speed);
  const snappedPosition = useRouteSnap(position);

  useEffect(() => {
    if (!map) return;
    cameraController.init(map as google.maps.Map);
    return () => cameraController.dispose();
  }, [map]);

  useEffect(() => {
    if (!position) return;
    const center = snappedPosition ?? position;
    cameraController.onPositionUpdate(center, heading, speed ?? 0);
  }, [position, snappedPosition, heading, speed]);

  return null;
}
