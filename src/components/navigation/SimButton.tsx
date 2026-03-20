import { useSensorStore } from "@/stores/sensorStore";

const BTN = "bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14";

export function SimButton() {
  const debugEnabled = useSensorStore((s) => s.debugEnabled);

  if (!debugEnabled) return null;

  const handleClick = () => {
    // Session 2 でポップアップ表示を実装する。
    // 現時点では console.log で動作確認のみ。
    console.log('[SensorBridge] SIM button clicked — popup will be implemented in Session 2');
  };

  return (
    <button className={BTN} onClick={handleClick}>
      <div className="w-12 h-12">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <text
            x="50" y="50"
            fill="#d97706"
            fontFamily="Arial, sans-serif" fontWeight="900" fontSize="28"
            textAnchor="middle" dominantBaseline="central"
          >
            SIM
          </text>
        </svg>
      </div>
    </button>
  );
}
