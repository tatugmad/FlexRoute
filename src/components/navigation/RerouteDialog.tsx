import { useRef, useCallback } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRouteStore } from "@/stores/routeStore";
import { rerouteBackToRoute, rerouteToNextWaypoint, rerouteToDestination } from "@/services/rerouteService";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

export function RerouteDialog() {
  const showRerouteDialog = useNavigationStore((s) => s.showRerouteDialog);
  const isRerouting = useNavigationStore((s) => s.isRerouting);
  const setIsRerouting = useNavigationStore((s) => s.setIsRerouting);
  const setReroutePolyline = useNavigationStore((s) => s.setReroutePolyline);
  const closeRerouteDialog = useNavigationStore((s) => s.closeRerouteDialog);

  const handledRef = useRef(false);

  const handleReroute = useCallback(async (choice: "backToRoute" | "nextWaypoint" | "destination") => {
    if (handledRef.current) return;
    handledRef.current = true;
    const { currentPosition, currentLegIndex, currentStepIndex } = useNavigationStore.getState();
    const waypoints = useRouteStore.getState().currentRoute?.waypoints ?? [];
    const legs = useRouteStore.getState().currentLegs;
    if (!currentPosition) { handledRef.current = false; return; }

    setIsRerouting(true);
    try {
      let polyline: string | null = null;
      if (choice === "backToRoute") polyline = await rerouteBackToRoute(currentPosition, legs, currentStepIndex);
      else if (choice === "nextWaypoint") polyline = await rerouteToNextWaypoint(currentPosition, waypoints, currentLegIndex);
      else polyline = await rerouteToDestination(currentPosition, waypoints, currentLegIndex);
      setReroutePolyline(polyline);
      fr.info(C.NAV, "reroute.selected", { choice, success: !!polyline });
    } catch (err) {
      fr.error(C.NAV, "reroute.failed", { choice, error: String(err) });
    } finally {
      setIsRerouting(false);
      closeRerouteDialog();
    }
  }, [setIsRerouting, setReroutePolyline, closeRerouteDialog]);

  if (!showRerouteDialog) {
    handledRef.current = false;
    return null;
  }

  return (
    <div className="absolute top-40 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-white rounded-2xl shadow-2xl p-4 w-72">
        <p className="text-sm font-bold text-slate-800 mb-3">ルートから逸脱しました</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => handleReroute("backToRoute")}
            className="w-full py-2 px-3 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-left"
            disabled={isRerouting}>
            逸脱地点に戻る
          </button>
          <button onClick={() => handleReroute("nextWaypoint")}
            className="w-full py-2 px-3 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-left font-medium"
            disabled={isRerouting}>
            次の経由地までリルート
          </button>
          <button onClick={() => handleReroute("destination")}
            className="w-full py-2 px-3 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-left"
            disabled={isRerouting}>
            目的地までリルート
          </button>
        </div>
        {isRerouting && (
          <p className="text-xs text-slate-400 mt-2 animate-pulse">ルート計算中...</p>
        )}
      </div>
    </div>
  );
}
