import { Reorder } from "framer-motion";
import { Plus } from "lucide-react";
import { WaypointItem } from "@/components/route/WaypointItem";
import { useRouteStore } from "@/stores/routeStore";
import type { Waypoint } from "@/types";

const EMPTY_WAYPOINTS: Waypoint[] = [];

export function WaypointList() {
  const waypoints = useRouteStore(
    (s) => s.currentRoute?.waypoints ?? EMPTY_WAYPOINTS,
  );
  const reorderWaypoints = useRouteStore((s) => s.reorderWaypoints);
  const addWaypoint = useRouteStore((s) => s.addWaypoint);

  const handleReorder = (newOrder: Waypoint[]) => {
    reorderWaypoints(newOrder);
  };

  const handleAddWaypoint = () => {
    const wp: Waypoint = {
      id: crypto.randomUUID(),
      position: { lat: 0, lng: 0 },
      label: `地点 ${waypoints.length + 1}`,
    };
    addWaypoint(wp);
  };

  return (
    <div className="mt-3">
      <Reorder.Group
        axis="y"
        values={waypoints}
        onReorder={handleReorder}
        className="space-y-0"
      >
        {waypoints.map((wp, index) => (
          <WaypointItem
            key={wp.id}
            waypoint={wp}
            index={index}
            total={waypoints.length}
          />
        ))}
      </Reorder.Group>

      <button
        onClick={handleAddWaypoint}
        className="mt-3 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-400/50 rounded-xl text-indigo-200 hover:border-indigo-300 hover:text-white transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        経路を追加
      </button>
    </div>
  );
}
