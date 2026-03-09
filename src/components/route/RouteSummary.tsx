import { Navigation } from "lucide-react";
import { useRouteStore } from "@/stores/routeStore";
import { formatDistance, formatDuration } from "@/utils/formatters";

export function RouteSummary() {
  const route = useRouteStore((s) => s.currentRoute);
  const isCalculating = useRouteStore((s) => s.isCalculatingRoute);
  const routeError = useRouteStore((s) => s.routeError);

  if (isCalculating) {
    return (
      <div className="mt-4 bg-indigo-700/50 rounded-xl p-4 backdrop-blur-sm border border-indigo-500/30">
        <div className="flex items-center gap-2 text-indigo-200 text-sm">
          <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
          ルート計算中...
        </div>
      </div>
    );
  }

  if (routeError) {
    return (
      <div className="mt-4 bg-indigo-700/50 rounded-xl p-4 backdrop-blur-sm border border-indigo-500/30">
        <p className="text-red-300 text-sm">{String(routeError)}</p>
      </div>
    );
  }

  if (!route || route.totalDistanceMeters === 0) return null;

  return (
    <div className="mt-4 bg-indigo-700/50 rounded-xl p-4 backdrop-blur-sm border border-indigo-500/30">
      <p className="text-xs text-indigo-300 font-medium mb-2">ルート概要</p>
      <div className="flex items-center gap-4 mb-3">
        <span className="text-lg font-bold text-white">
          {formatDistance(Number(route.totalDistanceMeters) || 0)}
        </span>
        <span className="text-lg font-bold text-white">
          {formatDuration(Number(route.totalDurationSeconds) || 0)}
        </span>
      </div>
      <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 font-medium transition-colors text-sm">
        <Navigation className="w-4 h-4" />
        ナビ開始
      </button>
    </div>
  );
}
