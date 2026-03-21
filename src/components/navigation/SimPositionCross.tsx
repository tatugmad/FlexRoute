import { useEffect } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useSensorStore } from "@/stores/sensorStore";

export function SimPositionCross() {
  useEffect(() => {
    if (!document.getElementById("sim-cross-style")) {
      const style = document.createElement("style");
      style.id = "sim-cross-style";
      style.textContent = `
        @keyframes simCrossBlink {
          0%, 49.9% { opacity: 0.8; }
          50%, 100% { opacity: 0.2; }
        }
        .sim-cross-blink {
          animation: simCrossBlink 1s step-end infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const isPositionSim = useSensorStore((s) => s.channelModes.position === "sim");
  const simPosition = useSensorStore((s) => s.simValues.position);

  if (!isPositionSim || !simPosition) return null;

  return (
    <AdvancedMarker position={simPosition} zIndex={102}>
      <div className="sim-cross-blink">
        <svg width="7" height="7" viewBox="0 0 7 7">
          <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="0" y1="3.5" x2="7" y2="3.5" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
      </div>
    </AdvancedMarker>
  );
}
