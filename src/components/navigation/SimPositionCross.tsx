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
      <svg className="sim-cross-blink" width="9" height="9" viewBox="0 0 9 9" style={{ background: 'transparent', display: 'block' }}>
        <line x1="4.5" y1="0" x2="4.5" y2="9" stroke="#3b82f6" strokeWidth="1.5" />
        <line x1="0" y1="4.5" x2="9" y2="4.5" stroke="#3b82f6" strokeWidth="1.5" />
      </svg>
    </AdvancedMarker>
  );
}
