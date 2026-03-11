import { LayoutGrid, List } from "lucide-react";
import type { RouteViewMode } from "@/types";

type ViewToggleProps = {
  current: RouteViewMode;
  onChange: (mode: RouteViewMode) => void;
};

export function ViewToggle({ current, onChange }: ViewToggleProps) {
  const active = "bg-white shadow-sm text-indigo-600";
  const inactive = "text-slate-500 hover:text-slate-700";

  return (
    <div className="flex bg-slate-200/70 rounded-xl p-1 shadow-inner">
      <button
        onClick={() => onChange("tile")}
        className={`p-2 rounded-lg transition-all ${current === "tile" ? active : inactive}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`p-2 rounded-lg transition-all ${current === "list" ? active : inactive}`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
