import { Reorder } from "framer-motion";
import { GripVertical, Plus, X } from "lucide-react";
import { useRouteStore } from "@/stores/routeStore";
import type { Waypoint } from "@/types";

type WaypointItemProps = {
  waypoint: Waypoint;
  index: number;
  total: number;
};

function getDotColor(index: number, total: number): string {
  if (index === 0) return "bg-emerald-500";
  if (index === total - 1) return "bg-rose-500";
  return "bg-amber-500";
}

export function WaypointItem({ waypoint, index, total }: WaypointItemProps) {
  const removeWaypoint = useRouteStore((s) => s.removeWaypoint);
  const addWaypoint = useRouteStore((s) => s.addWaypoint);

  const handleInsert = () => {
    const wp: Waypoint = {
      id: crypto.randomUUID(),
      position: { lat: 0, lng: 0 },
      label: `経由地 ${index + 1}`,
    };
    addWaypoint(wp, index + 1);
  };

  return (
    <div>
      <Reorder.Item
        value={waypoint}
        className="flex items-center gap-2 bg-indigo-700/30 rounded-xl px-3 py-2.5"
      >
        <GripVertical className="w-4 h-4 text-indigo-300 cursor-grab flex-shrink-0" />
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getDotColor(index, total)}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{String(waypoint.label ?? "")}</p>
          {waypoint.isCurrentLocation && (
            <p className="text-xs text-indigo-300">現在地</p>
          )}
        </div>
        <button
          onClick={() => removeWaypoint(waypoint.id)}
          className="p-1 text-indigo-300 hover:text-rose-500 transition-colors flex-shrink-0"
          aria-label="削除"
        >
          <X className="w-4 h-4" />
        </button>
      </Reorder.Item>

      {index < total - 1 && (
        <div className="flex items-center justify-center py-0.5">
          <div className="w-0.5 h-4 bg-slate-200/20" />
          <button
            onClick={handleInsert}
            className="mx-2 p-0.5 text-indigo-300 hover:text-white transition-colors"
            aria-label="経由地を挿入"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-0.5 h-4 bg-slate-200/20" />
        </div>
      )}
    </div>
  );
}
