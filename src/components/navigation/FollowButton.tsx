import { useNavigationStore } from "@/stores/navigationStore";

const BTN = "bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14";

export function FollowButton() {
  const followMode = useNavigationStore((s) => s.followMode);
  const setFollowMode = useNavigationStore((s) => s.setFollowMode);

  const handleClick = () => {
    setFollowMode("auto");
  };

  const isAuto = followMode === "auto";

  return (
    <button className={BTN} onClick={handleClick}>
      <div className="w-12 h-12">
        {isAuto ? (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 15.36 70 A 40 40 0 1 1 84.64 70" stroke="currentColor" strokeWidth="4" className="text-blue-500" opacity="0.8" />
            <path d="M 50 0 V 15 M 0 50 H 15 M 100 50 H 85" stroke="currentColor" strokeWidth="4" className="text-blue-500" />
            <path d="M 50 27 L 33 69 L 50 64 L 67 69 Z" fill="currentColor" className="text-slate-800" />
            <text x="50" y="88" fill="#3b82f6" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" dominantBaseline="middle" stroke="none">CENTER</text>
          </svg>
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g className="text-blue-500" stroke="currentColor" strokeWidth="4">
              <path d="M 50 17 V 0 M 37.5 12.5 L 50 0 L 62.5 12.5" />
              <path d="M 17 50 H 0 M 12.5 37.5 L 0 50 L 12.5 62.5" />
              <path d="M 83 50 H 100 M 87.5 37.5 L 100 50 L 87.5 62.5" />
            </g>
            <path d="M 50 27 L 33 69 L 50 64 L 67 69 Z" fill="#ef4444" />
            <text x="50" y="88" fill="#3b82f6" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" dominantBaseline="middle" stroke="none">CENTER</text>
          </svg>
        )}
      </div>
    </button>
  );
}
