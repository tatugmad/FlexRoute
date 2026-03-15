import { Trash2 } from "lucide-react";
import type { PlaceLabel } from "@/types";

type LabelItemProps = {
  label: PlaceLabel;
  onEdit: (label: PlaceLabel) => void;
  onDelete: (label: PlaceLabel) => void;
};

export function LabelCard({ label, onEdit, onDelete }: LabelItemProps) {
  return (
    <button onClick={() => onEdit(label)} className="w-full bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow overflow-hidden text-left flex flex-col cursor-pointer">
      <div className="h-[110px] w-full bg-slate-100 flex items-center justify-center">
        <span className="w-12 h-12 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 truncate flex-1 mr-2">{label.name}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(label); }} className="p-1 text-slate-400 hover:text-rose-500 shrink-0" aria-label="削除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs text-slate-500">0件</span>
      </div>
    </button>
  );
}

export function LabelRow({ label, onEdit, onDelete }: LabelItemProps) {
  return (
    <button onClick={() => onEdit(label)} className="w-full flex items-center gap-3 bg-white rounded-xl border border-slate-300 hover:shadow-md transition-shadow px-4 py-3 cursor-pointer text-left">
      <div className="w-24 h-16 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
        <span className="w-8 h-8 rounded-full" style={{ backgroundColor: label.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-slate-800 truncate flex-1 mr-2">{label.name}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(label); }} className="p-1 text-slate-400 hover:text-rose-500 shrink-0" aria-label="削除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm text-slate-600">0件</span>
      </div>
    </button>
  );
}
