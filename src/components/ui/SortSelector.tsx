import { ChevronDown } from "lucide-react";
import type { RouteSortKey } from "@/types";

const SORT_OPTIONS: { value: RouteSortKey; label: string }[] = [
  { value: "updatedAt", label: "更新日" },
  { value: "createdAt", label: "作成日" },
  { value: "name", label: "名前" },
  { value: "distance", label: "距離" },
];

type SortSelectorProps = {
  value: RouteSortKey;
  onChange: (key: RouteSortKey) => void;
};

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RouteSortKey)}
        className="appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer w-full"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}
