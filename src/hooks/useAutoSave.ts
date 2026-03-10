import { useEffect, useRef } from "react";
import { useRouteStore } from "@/stores/routeStore";

export function canSaveRoute(waypointCount: number, routeName: string): boolean {
  return waypointCount > 0 || routeName.trim().length > 0;
}

export function useAutoSave() {
  const waypoints = useRouteStore((s) => s.currentRoute?.waypoints);
  const encodedPolyline = useRouteStore((s) => s.encodedPolyline);
  const currentLegs = useRouteStore((s) => s.currentLegs);
  const isInitialRef = useRef(true);

  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    const state = useRouteStore.getState();
    if (!state.isDirty || !state.currentRoute) return;
    if (!canSaveRoute(state.currentRoute.waypoints.length, state.routeName)) return;
    state.saveCurrentRoute();
  }, [waypoints, encodedPolyline, currentLegs]);
}
