import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";

function computeMetersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

export function AccuracyCircle() {
  const map = useMap();
  const accuracy = useNavigationStore((s) => s.accuracy);
  const position = useNavigationStore((s) => s.currentPosition);

  if (!accuracy || !position || !map) return null;

  const zoom = map.getZoom();
  if (zoom == null) return null;

  const mpp = computeMetersPerPixel(position.lat, zoom);
  if (mpp <= 0) return null;

  const diameter = Math.round((accuracy / mpp) * 2);
  if (diameter < 4) return null;

  return (
    <div
      className="bg-blue-400/20 border border-blue-400/40 rounded-full"
      style={{
        width: diameter,
        height: diameter,
        marginLeft: -diameter / 2,
        marginTop: -diameter / 2,
        position: "absolute",
        left: "50%",
        top: "50%",
        pointerEvents: "none",
      }}
    />
  );
}
