import { useEffect, useRef } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSensorStore } from "@/stores/sensorStore";
import { useRouteSnap } from "@/hooks/useRouteSnap";
import { AccuracyCircle } from "@/components/navigation/AccuracyCircle";
import { shortestDelta } from "@/utils/headingUtils";
import type { PositionQuality } from "@/types";

function getPointerColor(quality: PositionQuality): string {
  if (quality === "denied") return "text-red-500";
  return "text-blue-600";
}

function getPointerExtra(quality: PositionQuality): string {
  if (quality === "lost" || quality === "denied") return "pointer-lost-blink";
  return "";
}

export function NavCurrentLocationMarker() {
  useEffect(() => {
    if (!document.getElementById("pointer-blink-style")) {
      const style = document.createElement("style");
      style.id = "pointer-blink-style";
      style.textContent = `
        @keyframes pointerBlink {
          0%, 49.9% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
        .pointer-lost-blink {
          animation: pointerBlink 0.5s step-end infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const position = useNavigationStore((s) => s.currentPosition);
  const heading = useNavigationStore((s) => s.heading);
  const headingMode = useNavigationStore((s) => s.headingMode);
  const followMode = useNavigationStore((s) => s.followMode);
  const positionQuality = useNavigationStore((s) => s.positionQuality);
  const prevMarkerHeadingRef = useRef(0);
  const isPositionSim = useSensorStore((s) => s.channelModes.position === "sim");
  const snappedPosition = useRouteSnap(position);
  const markerPosition = snappedPosition ?? position;

  const rawMarkerHeading = headingMode === "northUp" ? heading : 0;
  const markerDelta = shortestDelta(prevMarkerHeadingRef.current, rawMarkerHeading);
  prevMarkerHeadingRef.current += markerDelta;
  const markerHeading = prevMarkerHeadingRef.current;

  if (!position) return null;

  const colorClass = getPointerColor(positionQuality);
  const extraClass = getPointerExtra(positionQuality);
  const isMarkerLock = followMode === "auto";

  return (
    <>
      <AccuracyCircle />

      {isMarkerLock ? (
        <FixedCenterPointer
          heading={markerHeading}
          colorClass={colorClass}
          extraClass={extraClass}
        />
      ) : (
        <AdvancedMarker position={markerPosition} zIndex={100}>
          <div className="relative flex items-center justify-center" style={{ transform: 'translateY(50%)' }}>
            <div
              className={`w-8 h-8 ${colorClass} ${extraClass} relative z-10`}
              style={{
                transform: `rotate(${markerHeading}deg)`,
                transition: "transform 0.3s ease-out",
              }}
            >
              <PointerSvg />
            </div>
          </div>
        </AdvancedMarker>
      )}

      {isPositionSim && (
        <AdvancedMarker position={position} zIndex={101}>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#f97316',
              border: '1px solid #ffffff',
              boxShadow: '0 0 2px rgba(0,0,0,0.3)',
            }}
          />
        </AdvancedMarker>
      )}
    </>
  );
}

function PointerSvg() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <path
        d="M 50 10 L 85 85 L 50 70 L 15 85 Z"
        fill="currentColor"
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FixedCenterPointer({
  heading,
  colorClass,
  extraClass,
}: {
  heading: number;
  colorClass: string;
  extraClass: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        className={`w-8 h-8 ${colorClass} ${extraClass} relative z-10`}
        style={{
          transform: `rotate(${heading}deg)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <PointerSvg />
      </div>
    </div>
  );
}
