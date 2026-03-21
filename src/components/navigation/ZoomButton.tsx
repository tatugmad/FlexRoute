import { useNavigationStore } from "@/stores/navigationStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

const BTN = "bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14";

export function ZoomButton() {
  const zoomMode = useNavigationStore((s) => s.zoomMode);
  const setZoomMode = useNavigationStore((s) => s.setZoomMode);
  const isLocked = zoomMode === "lockedZoom";

  const toggle = () => {
    setZoomMode(isLocked ? "autoZoom" : "lockedZoom");
    fr.debug(C.NAV, "nav.zoomToggle", { to: isLocked ? "autoZoom" : "lockedZoom" });
  };

  return (
    <button className={BTN} onClick={toggle}>
      <div className="w-12 h-12">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g stroke="#3b82f6" strokeWidth="4" strokeLinecap="butt" strokeLinejoin="bevel" fill="none">
            <path d="M 12 25 V 12 H 35" />
            <path d="M 88 25 V 12 H 65" />
            <path d="M 8 68 V 86 H 16" />
            <path d="M 90 68 V 86 H 84" />
          </g>
          <text
            x="50" y="49"
            fill={isLocked ? "#ef4444" : "#4b5563"}
            fontFamily="Arial, sans-serif" fontWeight="900" fontSize="38"
            textAnchor="middle" dominantBaseline="middle"
          >
            {isLocked ? "Lock" : "Auto"}
          </text>
          <text
            x="50" y="87"
            fill="#3b82f6"
            fontFamily="Arial, sans-serif" fontWeight="900" fontSize="19"
            textAnchor="middle" dominantBaseline="middle"
          >
            ZOOM
          </text>
        </svg>
      </div>
    </button>
  );
}
