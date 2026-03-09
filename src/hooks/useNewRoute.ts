import { useCallback } from "react";
import { useRouteStore } from "@/stores/routeStore";
import type { Route } from "@/types";

export function useNewRoute() {
  const setCurrentRoute = useRouteStore((s) => s.setCurrentRoute);
  const setRouteName = useRouteStore((s) => s.setRouteName);
  const clearRouteData = useRouteStore((s) => s.clearRouteData);

  return useCallback(() => {
    const now = Date.now();
    const route: Route = {
      id: crypto.randomUUID(),
      name: "",
      waypoints: [],
      legs: [],
      travelMode: "DRIVE",
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      createdAt: now,
      updatedAt: now,
    };
    clearRouteData();
    setCurrentRoute(route);
    setRouteName("");
  }, [setCurrentRoute, setRouteName, clearRouteData]);
}
