import { ArrowLeft } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useUiStore } from "@/stores/uiStore";
import { formatDistance, formatDuration } from "@/utils/formatters";

export function NavHeader() {
  const remainingDistance = useNavigationStore((s) => s.remainingDistanceMeters);
  const remainingDuration = useNavigationStore((s) => s.remainingDurationSeconds);
  const speed = useNavigationStore((s) => s.speed);
  const stopNavigation = useNavigationStore((s) => s.stopNavigation);
  const setViewMode = useUiStore((s) => s.setViewMode);

  const handleStop = () => {
    stopNavigation();
    setViewMode("route");
  };

  const speedKmh = Math.round((speed ?? 0) * 3.6);
  const duration = formatDuration(remainingDuration);
  const distance = formatDistance(remainingDistance);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
      <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl max-w-sm backdrop-blur-md bg-opacity-95 border border-emerald-500/50 flex items-center gap-4">
        <button
          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          title="ナビを終了"
          onClick={handleStop}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <span className="font-bold text-lg tracking-tight">ナビゲーション中</span>
          </div>
          <div className="flex gap-6 text-emerald-50">
            <div>
              <div className="text-[10px] uppercase opacity-80 font-medium leading-none mb-1">到着予想</div>
              <div className="font-mono text-lg leading-none">{duration}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase opacity-80 font-medium leading-none mb-1">距離</div>
              <div className="font-mono text-lg leading-none">{distance}</div>
            </div>
            <div className="pl-4 border-l border-emerald-400/30">
              <div className="text-[10px] uppercase opacity-80 font-medium leading-none mb-1">速度</div>
              <div className="font-mono text-xl font-black text-white leading-none">
                {speedKmh}<span className="text-[10px] ml-0.5">km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
