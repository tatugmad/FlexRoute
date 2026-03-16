import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLabelStore } from "@/stores/labelStore";

const PRESET_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#64748b",
] as const;

const DEFAULT_COLOR: string = PRESET_COLORS[0];

export function LabelEditModal() {
  const isOpen = useLabelStore((s) => s.isLabelModalOpen);
  const editingLabel = useLabelStore((s) => s.editingLabel);
  const closeLabelModal = useLabelStore((s) => s.closeLabelModal);
  const addLabel = useLabelStore((s) => s.addLabel);
  const updateLabel = useLabelStore((s) => s.updateLabel);

  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [forRoute, setForRoute] = useState(true);
  const [forPlace, setForPlace] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setName(editingLabel?.name ?? "");
      setColor(editingLabel?.color ?? DEFAULT_COLOR);
      setForRoute(editingLabel?.forRoute ?? true);
      setForPlace(editingLabel?.forPlace ?? true);
    }
  }, [isOpen, editingLabel]);

  if (!isOpen) return null;

  const isValid = name.trim().length > 0 && (forRoute || forPlace);

  const handleSave = () => {
    if (!isValid) return;
    if (editingLabel) {
      updateLabel(editingLabel.id, { name: name.trim(), color, forRoute, forPlace });
    } else {
      addLabel(name.trim(), color, forRoute, forPlace);
    }
    closeLabelModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeLabelModal}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            {editingLabel ? "ラベルを編集" : "ラベルを作成"}
          </h2>
          <button onClick={closeLabelModal} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ラベル名を入力..."
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-base text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4"
          autoFocus
        />

        <div className="flex gap-2 mb-6">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-all ${
                color === c ? "ring-2 ring-offset-2 ring-indigo-500" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={forRoute}
              onChange={(e) => setForRoute(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            ルートに使う
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={forPlace}
              onChange={(e) => setForPlace(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            場所に使う
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={closeLabelModal}
            className="px-4 py-2 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
              isValid
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-slate-300 text-white cursor-not-allowed"
            }`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
