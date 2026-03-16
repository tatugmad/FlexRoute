import { useState } from "react";
import { Trash2, Map } from "lucide-react";
import type { SavedRoute, RouteViewMode } from "@/types";

type RouteCardProps = {
  route: SavedRoute;
  viewMode: RouteViewMode;
  onSelect: (id: string) => void;
  onDelete: (routeId: string) => void;
};

function TilePlaceholder() {
  return (
    <div className="bg-slate-100 flex items-center justify-center border-b border-slate-300 h-[86px] sm:h-[160px]">
      <Map className="w-6 h-6 text-slate-400" />
    </div>
  );
}

function ListPlaceholder() {
  return (
    <div className="w-24 h-16 bg-slate-100 flex items-center justify-center">
      <Map className="w-5 h-5 text-slate-400" />
    </div>
  );
}

export function RouteCard({ route, viewMode, onSelect, onDelete }: RouteCardProps) {
  const [imgError, setImgError] = useState(false);
  const waypointCount = route.waypoints.length;
  const displayName = route.name.trim() || "名称未設定";
  const showImage = route.thumbnailUrl && !imgError;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(route.id);
  };

  if (viewMode === "list") {
    return (
      <button
        onClick={() => onSelect(route.id)}
        className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow pr-3 text-left"
      >
        <div className="w-24 h-16 rounded-l-2xl overflow-hidden shrink-0">
          {showImage ? (
            <img
              src={route.thumbnailUrl!}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <ListPlaceholder />
          )}
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
      {showImage ? (
        <>
          <img
            src={route.thumbnailUrlSmall ?? route.thumbnailUrl!}
            alt=""
            className="w-full h-[86px] object-cover sm:hidden"
            onError={() => setImgError(true)}
          />
          <img
            src={route.thumbnailUrl!}
            alt=""
            className="w-full hidden sm:block sm:h-[160px] object-cover"
            onError={() => setImgError(true)}
          />
        </>
      ) : (
        <TilePlaceholder />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-base font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-[10px] sm:text-sm text-slate-600 mt-0.5">{waypointCount}地点</p>
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
