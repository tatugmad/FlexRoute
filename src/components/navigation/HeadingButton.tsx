import { useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { shortestDelta } from "@/utils/headingUtils";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

const BTN = "bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14";

export function HeadingButton() {
  const headingMode = useNavigationStore((s) => s.headingMode);
  const setHeadingMode = useNavigationStore((s) => s.setHeadingMode);
  const heading = useNavigationStore((s) => s.heading);
  const prevHeadingRef = useRef(0);

  const toggle = () => {
    const next = headingMode === "northUp" ? "headingUp" : "northUp";
    setHeadingMode(next);
    fr.debug(C.NAV, "nav.headingToggle", { to: next });
  };

  const rawHeading = headingMode === "headingUp" ? heading : 0;
  const delta = shortestDelta(prevHeadingRef.current, rawHeading);
  prevHeadingRef.current += delta;
  const mapHeading = prevHeadingRef.current;

  return (
    <button className={BTN} onClick={toggle}>
      {headingMode === "headingUp" ? (
        <div className="relative w-14 h-14">
          <div
            className="w-full h-full transition-transform duration-300 ease-out p-1"
            style={{ transform: `rotate(${-mapHeading}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M 50 8 L 65 48 L 35 48 Z" fill="#ef4444" />
              <path d="M 50 92 L 35 52 L 65 52 Z" fill="#a8b4c4" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-8 h-6 mb-0">
            <path d="M 50 8 L 75 83 L 25 83 Z" fill="#ef4444" />
          </svg>
          <span
            className="text-2xl font-black text-slate-800 leading-none mt-[-4px]"
            style={{ fontFamily: "sans-serif" }}
          >
            N
          </span>
        </div>
      )}
    </button>
  );
}
