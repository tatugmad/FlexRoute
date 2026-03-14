import { useNavigationStore } from "@/stores/navigationStore";

export function LostAlert() {
  const quality = useNavigationStore((s) => s.positionQuality);

  if (quality !== "lost") return null;

  return (
    <div className="absolute top-4 left-4 z-40 md:left-[25.5rem]">
      <div className="bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 flex items-center justify-center w-14 h-14">
        <svg viewBox="0 0 100 100" className="w-8 h-8">
          <path
            d="M 50 10 L 90 85 H 10 Z"
            fill="#f59e0b"
            stroke="white"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <text
            x="50"
            y="72"
            fill="white"
            fontFamily="Arial, sans-serif"
            fontWeight="900"
            fontSize="48"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            !
          </text>
        </svg>
      </div>
    </div>
  );
}
