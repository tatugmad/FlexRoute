import { useEffect, useRef } from "react";
import { useRouteStore } from "@/stores/routeStore";
import { computeRoutes } from "@/services/routeApi";
import { logService } from "@/services/logService";
import type { ComputeRoutesRequest, RoutesApiStep, Waypoint } from "@/types";

const EMPTY_WAYPOINTS: Waypoint[] = [];

function toApiWaypoint(wp: Waypoint) {
  if (wp.placeId) return { placeId: wp.placeId };
  return {
    location: {
      latLng: { latitude: wp.position.lat, longitude: wp.position.lng },
    },
  };
}

function parseDuration(duration: unknown): number {
  if (typeof duration !== "string") return 0;
  const match = duration.match(/^(\d+)s$/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

export function useRouteCalculation() {
  const waypoints = useRouteStore(
    (s) => s.currentRoute?.waypoints ?? EMPTY_WAYPOINTS,
  );
  const travelMode = useRouteStore((s) => s.travelMode);
  const setRouteData = useRouteStore((s) => s.setRouteData);
  const setRouteError = useRouteStore((s) => s.setRouteError);
  const setIsCalculating = useRouteStore((s) => s.setIsCalculatingRoute);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const validWps = waypoints.filter(
      (wp) =>
        Number.isFinite(wp.position.lat) &&
        Number.isFinite(wp.position.lng) &&
        !(wp.position.lat === 0 && wp.position.lng === 0),
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
          totalDistanceMeters: Number(route.distanceMeters) || 0,
          totalDurationSeconds: parseDuration(route.duration),
          encodedPolyline: String(route.polyline.encodedPolyline),
          steps: allSteps,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : "ルート計算エラー";
        logService.error("ROUTE", "ルート計算に失敗", { error: message });
        setRouteError(String(message));
      });

    return () => controller.abort();
  }, [waypoints, travelMode, setRouteData, setRouteError, setIsCalculating]);
}
