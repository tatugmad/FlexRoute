import { useNavigationStore } from "@/stores/navigationStore";
import type { PositionQuality } from "@/types";

const BADGE_STYLES: Record<PositionQuality, string> = {
  gps: "bg-emerald-500 text-white",
  wifi: "bg-amber-400 text-slate-800",
  lost: "bg-rose-500 text-white",
};

const BADGE_LABELS: Record<PositionQuality, string> = {
  gps: "GPS",
  wifi: "WiFi",
  lost: "LOST",
};

export function PositionQualityBadge() {
  const quality = useNavigationStore((s) => s.positionQuality);

  return (
    <span
      className={`text-xs font-bold rounded-full px-2 py-0.5 ${BADGE_STYLES[quality]}`}
    >
      {BADGE_LABELS[quality]}
    </span>
  );
}
