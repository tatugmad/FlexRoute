import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { RouteCard } from "@/components/top/RouteCard";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { SearchInput } from "@/components/ui/SearchInput";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import { CARD_WIDTH } from "@/constants/cardLayout";
import { useNewRoute } from "@/hooks/useNewRoute";
import { matchesQuery } from "@/utils/searchFilter";

export function RouteList() {
  const savedRoutes = useRouteStore((s) => s.savedRoutes);
  const loadRoute = useRouteStore((s) => s.loadRoute);
  const deleteRoute = useRouteStore((s) => s.deleteRoute);
  const loadSavedRoutes = useRouteStore((s) => s.loadSavedRoutes);
  const routeViewMode = useUiStore((s) => s.routeViewMode);
  const setRouteViewMode = useUiStore((s) => s.setRouteViewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const openConfirmDialog = useUiStore((s) => s.openConfirmDialog);
  const createNewRoute = useNewRoute();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSavedRoutes();
  }, [loadSavedRoutes]);

  const handleNewRoute = () => {
    createNewRoute();
    setViewMode("route");
  };

  const handleSelect = (id: string) => {
    loadRoute(id);
    setViewMode("route");
  };

  const handleDelete = (routeId: string) => {
    openConfirmDialog("このルートを削除しますか？", () => deleteRoute(routeId));
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <ViewToggle current={routeViewMode} onChange={setRouteViewMode} />
        <div className="w-full order-last sm:order-none sm:w-auto sm:flex-1 min-w-0">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="ルートを検索..." />
        </div>
        <button
          onClick={handleNewRoute}
          className="ml-auto bg-indigo-600 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-500 transition-colors flex items-center text-sm"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">新規作成</span>
        </button>
      </div>

      {savedRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="text-sm">保存されたルートはありません</p>
        </div>
      ) : (() => {
        const filteredRoutes = savedRoutes.filter((route) =>
          matchesQuery(searchQuery, [
            route.name,
            ...route.waypoints.map((wp) => wp.label),
          ])
        );
        return filteredRoutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <p className="text-sm">一致するルートはありません</p>
          </div>
        ) : (
          <div
            className={
              routeViewMode === "tile"
                ? "flex flex-wrap gap-3"
                : "flex flex-col gap-3"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredRoutes.map((route) => (
                <motion.div
                  key={route.id}
                  exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
                  style={routeViewMode === "tile" ? { width: CARD_WIDTH } : undefined}
                  className={routeViewMode === "tile" ? "" : "w-full"}
                >
                  <RouteCard
                    route={route}
                    viewMode={routeViewMode}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      })()}
    </div>
  );
}
