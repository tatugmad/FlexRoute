import { Trash2, MapPin } from "lucide-react";
import type { SavedRoute, RouteViewMode } from "@/types";

type RouteCardProps = {
  route: SavedRoute;
  viewMode: RouteViewMode;
  onSelect: (id: string) => void;
  onDelete: (routeId: string) => void;
};

export function RouteCard({ route, viewMode, onSelect, onDelete }: RouteCardProps) {
  const waypointCount = route.waypoints.length;
  const displayName = route.name || "名称未設定";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(route.id);
  };

  if (viewMode === "list") {
    return (
      <button
        onClick={() => onSelect(route.id)}
        className="w-full flex items-center gap-4 bg-white rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow px-4 py-3 text-left"
      >
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
          <p className="text-xs text-slate-500">{waypointCount}地点</p>
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
      className="w-full bg-white rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow p-4 text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <MapPin className="w-5 h-5 text-indigo-600" />
        </div>
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          aria-label="削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
      <p className="text-xs text-slate-500 mt-1">{waypointCount}地点</p>
    </button>
  );
}
