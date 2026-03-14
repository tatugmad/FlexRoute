import { AdvancedMarker } from "@vis.gl/react-google-maps";

import { useNavigationStore } from "@/stores/navigationStore";
import type { LatLng } from "@/types";

type CurrentLocationMarkerProps = {
  position: LatLng;
};

export function CurrentLocationMarker({ position }: CurrentLocationMarkerProps) {
  const heading = useNavigationStore((s) => s.heading);
  useNavigationStore((s) => s.accuracy); // subscribe for future use

  return (
    <AdvancedMarker position={position} zIndex={100}>
      <div className="relative flex items-center justify-center">
        <div className="absolute w-[90%] h-[90%] bg-white/80 rounded-full animate-pulse-fast" />
        <div
          className="w-8 h-8 text-blue-600 relative z-10"
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
  );
}
