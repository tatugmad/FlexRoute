import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { useUiStore } from "@/stores/uiStore";
import { useLabelStore } from "@/stores/labelStore";
import type { PlaceLabel } from "@/types";

export function LabelList() {
  const labels = useLabelStore((s) => s.labels);
  const loadLabels = useLabelStore((s) => s.loadLabels);
  const openLabelModal = useLabelStore((s) => s.openLabelModal);
  const deleteLabel = useLabelStore((s) => s.deleteLabel);
  const openConfirmDialog = useUiStore((s) => s.openConfirmDialog);
  const viewMode = useUiStore((s) => s.labelViewMode);
  const setViewMode = useUiStore((s) => s.setLabelViewMode);

  useEffect(() => { loadLabels(); }, [loadLabels]);

  const handleDelete = (label: PlaceLabel) => {
    openConfirmDialog(`「${label.name}」を削除しますか？`, () => deleteLabel(label.id));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <ViewToggle current={viewMode} onChange={setViewMode} />
        <button
          onClick={() => openLabelModal()}
          className="bg-indigo-600 text-white p-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-500 transition-colors flex items-center text-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {labels.length === 0 ? (
        <EmptyState />
      ) : viewMode === "tile" ? (
        <div className="grid grid-cols-2 gap-3">
          {labels.map((label) => (
            <LabelCard key={label.id} label={label} onEdit={openLabelModal} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {labels.map((label) => (
            <LabelRow key={label.id} label={label} onEdit={openLabelModal} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

type LabelItemProps = {
  label: PlaceLabel;
  onEdit: (label: PlaceLabel) => void;
  onDelete: (label: PlaceLabel) => void;
};

function LabelCard({ label, onEdit, onDelete }: LabelItemProps) {
  return (
    <button onClick={() => onEdit(label)} className="bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow p-4 text-left flex flex-col items-center gap-2 relative cursor-pointer">
      <div className="absolute top-2 right-2">
        <button onClick={(e) => { e.stopPropagation(); onDelete(label); }} className="p-1 text-slate-400 hover:text-rose-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <span className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
      <span className="text-base font-bold text-slate-800 text-center truncate w-full">{label.name}</span>
      <span className="text-sm text-slate-600">0件</span>
    </button>
  );
}

function LabelRow({ label, onEdit, onDelete }: LabelItemProps) {
  return (
    <button onClick={() => onEdit(label)} className="w-full flex items-center gap-3 bg-white rounded-xl border border-slate-300 hover:shadow-md transition-shadow px-4 py-3 cursor-pointer text-left">
      <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
      <span className="flex-1 text-base font-bold text-slate-800">{label.name}</span>
      <span className="text-sm text-slate-600 mr-2">0件</span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(label); }} className="p-1 text-slate-400 hover:text-rose-500">
        <Trash2 className="w-4 h-4" />
      </button>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-sm">ラベルはまだありません</p>
      <p className="text-xs mt-1 text-slate-500">「+」ボタンからラベルを作成しましょう</p>
    </div>
  );
}
