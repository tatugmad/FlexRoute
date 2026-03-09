import { Plus, LayoutGrid, List } from "lucide-react";
import { RouteCard } from "@/components/top/RouteCard";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import { useNewRoute } from "@/hooks/useNewRoute";
import type { Route } from "@/types";

export function RouteList() {
  const savedRoutes = useRouteStore((s) => s.savedRoutes);
  const setCurrentRoute = useRouteStore((s) => s.setCurrentRoute);
  const setRouteName = useRouteStore((s) => s.setRouteName);
  const setSavedRoutes = useRouteStore((s) => s.setSavedRoutes);
  const routeViewMode = useUiStore((s) => s.routeViewMode);
  const setRouteViewMode = useUiStore((s) => s.setRouteViewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const createNewRoute = useNewRoute();

  const handleNewRoute = () => {
    createNewRoute();
    setViewMode("route");
  };

  const handleSelect = (route: Route) => {
    setCurrentRoute(route);
    setRouteName(route.name);
    setViewMode("route");
  };

  const handleDelete = (routeId: string) => {
    setSavedRoutes(savedRoutes.filter((r) => r.id !== routeId));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <ViewToggle current={routeViewMode} onChange={setRouteViewMode} />
        <button
          onClick={handleNewRoute}
          className="bg-indigo-600 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-500 transition-colors flex items-center text-sm"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">新規作成</span>
        </button>
      </div>

      {savedRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-sm">保存されたルートはありません</p>
        </div>
      ) : (
        <div
          className={
            routeViewMode === "tile"
              ? "grid grid-cols-2 gap-3"
              : "flex flex-col gap-3"
          }
        >
          {savedRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              viewMode={routeViewMode}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  current,
  onChange,
}: {
  current: "tile" | "list";
  onChange: (mode: "tile" | "list") => void;
}) {
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
