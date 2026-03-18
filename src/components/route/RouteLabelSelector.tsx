import { Check } from "lucide-react";
import { useLabelStore } from "@/stores/labelStore";
import { useRouteStore } from "@/stores/routeStore";

export function RouteLabelSelector() {
  const labels = useLabelStore((s) => s.labels);
  const currentLabelIds = useRouteStore((s) => s.currentLabelIds);
  const setCurrentLabelIds = useRouteStore((s) => s.setCurrentLabelIds);

  const routeLabels = labels.filter((l) => l.forRoute);
  if (routeLabels.length === 0) return null;

  const toggleLabel = (labelId: string) => {
    const next = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter((id) => id !== labelId)
      : [...currentLabelIds, labelId];
    setCurrentLabelIds(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {routeLabels.map((label) => {
        const selected = currentLabelIds.includes(label.id);
        return (
          <button
            key={label.id}
            onClick={() => toggleLabel(label.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selected
                ? "border-white/60 bg-white/25 text-white"
                : "border-white/30 bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
            {selected && <Check className="w-3.5 h-3.5" />}
          </button>
        );
      })}
    </div>
  );
}
