import { useCallback } from "react";
import { useRouteStore } from "@/stores/routeStore";

export function useNewRoute() {
  const newRoute = useRouteStore((s) => s.newRoute);
  return useCallback(() => newRoute(), [newRoute]);
}
