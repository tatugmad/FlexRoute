import { useState } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { useLabelStore } from "@/stores/labelStore";
import { usePlaceStore } from "@/stores/placeStore";
import type { PlaceModalData } from "@/types";

type Props = {
  data: PlaceModalData;
  onBack: () => void;
  onSaved: () => void;
};

export function PlaceSaveStep({ data, onBack, onSaved }: Props) {
  const labels = useLabelStore((s) => s.labels);
  const openLabelModal = useLabelStore((s) => s.openLabelModal);
  const addPlace = usePlaceStore((s) => s.addPlace);
  const [name, setName] = useState(data.name);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  const toggleLabel = (id: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    addPlace({
      placeId: data.placeId,
      name: name.trim() || data.name,
      originalName: data.name,
      address: data.address,
      position: data.position,
      rating: data.rating,
      photoUrl: data.photoUrl,
      labelIds: selectedLabelIds,
      userNote: memo,
    });
    onSaved();
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold text-slate-800 mb-3">場所を保存</h3>

      <div className="mb-4">
        <p className="text-sm font-medium text-slate-600 mb-1">名前</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="場所の名前"
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        />
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-slate-600 mb-2">ラベル</p>
        {labels.length === 0 ? (
          <div>
            <p className="text-sm text-slate-400 mb-2">ラベルなし</p>
            <button
              onClick={() => openLabelModal()}
              className="text-sm text-indigo-500 font-medium hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              ラベルを作成
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedLabelIds.includes(label.id)
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                  {selectedLabelIds.includes(label.id) && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => openLabelModal()}
              className="mt-2 text-sm text-indigo-500 font-medium hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              ラベルを作成
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="メモ（任意）"
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          保存
        </button>
      </div>
    </div>
  );
}
