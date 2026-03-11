import { Plus } from "lucide-react";

const DUMMY_LABELS = [
  { id: "1", name: "お気に入り", color: "#ef4444", placeCount: 3 },
  { id: "2", name: "キャンプ場", color: "#22c55e", placeCount: 5 },
  { id: "3", name: "温泉", color: "#3b82f6", placeCount: 2 },
  { id: "4", name: "道の駅", color: "#f59e0b", placeCount: 8 },
];

export function LabelList() {
  const labels = DUMMY_LABELS;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-700">
          {labels.length}件のラベル
        </p>
        <button className="bg-indigo-600 text-white p-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-500 transition-colors flex items-center text-sm">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {labels.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2">
          {labels.map((label) => (
            <LabelRow key={label.id} label={label} />
          ))}
        </div>
      )}
    </div>
  );
}

function LabelRow({
  label,
}: {
  label: { id: string; name: string; color: string; placeCount: number };
}) {
  return (
    <button className="w-full flex items-center gap-3 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow px-4 py-3 text-left">
      <span
        className="w-4 h-4 rounded-full shrink-0"
        style={{ backgroundColor: label.color }}
      />
      <span className="flex-1 text-sm font-bold text-slate-800">
        {label.name}
      </span>
      <span className="text-xs text-slate-500">{label.placeCount}件</span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-sm">ラベルはまだありません</p>
      <p className="text-xs mt-1 text-slate-400">
        「+」ボタンからラベルを作成しましょう
      </p>
    </div>
  );
}
