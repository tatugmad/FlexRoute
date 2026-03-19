import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRouteSnap } from "@/hooks/useRouteSnap";
import { AccuracyCircle } from "@/components/navigation/AccuracyCircle";
import type { PositionQuality } from "@/types";

function getPointerColor(quality: PositionQuality): string {
  if (quality === "denied") return "text-red-500";
  return "text-blue-600";
}

function getPointerExtra(quality: PositionQuality): string {
  if (quality === "lost") return "animate-pulse";
  return "";
}

export function NavCurrentLocationMarker() {
  const position = useNavigationStore((s) => s.currentPosition);
  const heading = useNavigationStore((s) => s.heading);
  const positionQuality = useNavigationStore((s) => s.positionQuality);
  const snappedPosition = useRouteSnap(position);
  const markerPosition = snappedPosition ?? position;

  if (!position) return null;

  const colorClass = getPointerColor(positionQuality);
  const extraClass = getPointerExtra(positionQuality);

  return (
    <>
      <AccuracyCircle />

      <AdvancedMarker position={markerPosition} zIndex={100}>
        <div className="relative flex items-center justify-center">
          <div
            className={`w-8 h-8 ${colorClass} ${extraClass} relative z-10`}
            style={{
              transform: `rotate(${heading}deg)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
              <path
                d="M 50 10 L 85 85 L 50 70 L 15 85 Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </AdvancedMarker>
    </>
  );
}
