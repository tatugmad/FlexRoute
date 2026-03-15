import { Check } from "lucide-react";
import { useLabelStore } from "@/stores/labelStore";
import { usePlaceStore } from "@/stores/placeStore";
import type { SavedPlace } from "@/types";

type Props = {
  place: SavedPlace;
};

export function PlaceLabelEditor({ place }: Props) {
  const labels = useLabelStore((s) => s.labels);
  const updatePlace = usePlaceStore((s) => s.updatePlace);

  const toggleLabel = (labelId: string) => {
    const newLabelIds = place.labelIds.includes(labelId)
      ? place.labelIds.filter((id) => id !== labelId)
      : [...place.labelIds, labelId];
    updatePlace(place.id, { labelIds: newLabelIds });
  };

  if (labels.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        ラベルなし（場所タブから追加できます）
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => {
        const selected = place.labelIds.includes(label.id);
        return (
          <button
            key={label.id}
            onClick={() => toggleLabel(label.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selected
                ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
