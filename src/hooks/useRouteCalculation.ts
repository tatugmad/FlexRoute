import { useEffect, useRef } from "react";
import { useRouteStore } from "@/stores/routeStore";
import { computeRoutes } from "@/services/routeApi";
import type { ComputeRoutesRequest, RoutesApiStep, Waypoint } from "@/types";

function toApiWaypoint(wp: Waypoint) {
  if (wp.placeId) return { placeId: wp.placeId };
  return { location: { latLng: wp.position } };
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)s$/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

export function useRouteCalculation() {
  const waypoints = useRouteStore(
    (s) => s.currentRoute?.waypoints ?? [],
  );
  const travelMode = useRouteStore((s) => s.travelMode);
  const setRouteData = useRouteStore((s) => s.setRouteData);
  const setRouteError = useRouteStore((s) => s.setRouteError);
  const setIsCalculating = useRouteStore((s) => s.setIsCalculatingRoute);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const validWps = waypoints.filter(
      (wp) => wp.position.lat !== 0 || wp.position.lng !== 0,
    );
    if (validWps.length < 2) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const origin = validWps[0]!;
    const destination = validWps[validWps.length - 1]!;

    const request: ComputeRoutesRequest = {
      origin: toApiWaypoint(origin),
      destination: toApiWaypoint(destination),
      intermediates:
        validWps.length > 2
          ? validWps.slice(1, -1).map(toApiWaypoint)
          : undefined,
      travelMode,
    };

    setIsCalculating(true);

    computeRoutes(request)
      .then((res) => {
        if (controller.signal.aborted) return;
        const route = res.routes[0];
        if (!route) {
          setRouteError("ルートが見つかりませんでした");
          return;
        }

        const allSteps: RoutesApiStep[] = route.legs.flatMap(
          (leg) => leg.steps ?? [],
        );

        setRouteData({
          totalDistanceMeters: route.distanceMeters,
          totalDurationSeconds: parseDuration(route.duration),
          encodedPolyline: route.polyline.encodedPolyline,
          steps: allSteps,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setRouteError(
          err instanceof Error ? err.message : "ルート計算エラー",
        );
      });

    return () => controller.abort();
  }, [waypoints, travelMode, setRouteData, setRouteError, setIsCalculating]);
}
