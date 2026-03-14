import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { WaypointList } from "@/components/route/WaypointList";
import { RouteSummary } from "@/components/route/RouteSummary";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import { PositionQualityBadge } from "@/components/ui/PositionQualityBadge";
import { useAutoSave, canSaveRoute } from "@/hooks/useAutoSave";

export function RouteEditor() {
  const routeName = useRouteStore((s) => s.routeName);
  const setRouteName = useRouteStore((s) => s.setRouteName);
  const saveCurrentRoute = useRouteStore((s) => s.saveCurrentRoute);
  const clearRouteData = useRouteStore((s) => s.clearRouteData);
  const setViewMode = useUiStore((s) => s.setViewMode);

  useAutoSave();

  const handleNameBlur = useCallback(() => {
    const state = useRouteStore.getState();
    if (!state.currentRoute || !state.isDirty) return;
    if (!canSaveRoute(state.currentRoute.waypoints.length, state.routeName)) return;
    saveCurrentRoute();
  }, [saveCurrentRoute]);

  const handleBack = useCallback(() => {
    (document.activeElement as HTMLElement)?.blur();
    const state = useRouteStore.getState();
    const wpCount = state.currentRoute?.waypoints.length ?? 0;
    if (canSaveRoute(wpCount, state.routeName) && state.isDirty) {
      state.saveCurrentRoute();
    }
    clearRouteData();
    setViewMode("top");
  }, [clearRouteData, setViewMode]);

  return (
    <aside className="w-96 h-full bg-indigo-600 text-white flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-indigo-500 transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="ルート名を入力..."
          className="flex-1 bg-indigo-700/50 text-white placeholder-indigo-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {import.meta.env.DEV && <PositionQualityBadge />}
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <WaypointList />
        <RouteSummary />
      </div>
    </aside>
  );
}
