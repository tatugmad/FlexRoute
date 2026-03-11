import { Trash2, Map } from "lucide-react";
import type { SavedRoute, RouteViewMode } from "@/types";

type RouteCardProps = {
  route: SavedRoute;
  viewMode: RouteViewMode;
  onSelect: (id: string) => void;
  onDelete: (routeId: string) => void;
};

export function RouteCard({ route, viewMode, onSelect, onDelete }: RouteCardProps) {
  const waypointCount = route.waypoints.length;
  const displayName = route.name.trim() || "名称未設定";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(route.id);
  };

  if (viewMode === "list") {
    return (
      <button
        onClick={() => onSelect(route.id)}
        className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow px-3 py-3 text-left"
      >
        <div className="w-16 h-16 bg-slate-100 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-300">
          <Map className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] text-slate-400 mt-0.5">サムネイル</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-800 truncate">{displayName}</p>
          <p className="text-sm text-slate-600">{waypointCount}地点</p>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          aria-label="削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect(route.id)}
      className="w-full bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow overflow-hidden text-left flex flex-col"
    >
      <div className="h-[120px] bg-slate-100 flex flex-col items-center justify-center border-b border-slate-300">
        <Map className="w-6 h-6 text-slate-400" />
        <span className="text-xs text-slate-400 mt-1">サムネイル</span>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-sm text-slate-600 mt-0.5">{waypointCount}地点</p>
          </div>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </button>
  );
}
