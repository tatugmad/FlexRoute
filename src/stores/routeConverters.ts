import type { Route, SavedRoute, SavedRouteLeg, TravelMode } from "@/types";
import { generateId } from "@/utils/generateId";

export function toSavedRoute(
  currentRoute: Route,
  routeName: string,
  encodedPolyline: string | null,
  currentLegs: SavedRouteLeg[],
  savedRoutes: SavedRoute[],
): SavedRoute {
  const existing = savedRoutes.find((r) => r.id === currentRoute.id);
  const now = new Date().toISOString();

  return {
    id: currentRoute.id,
    name: routeName,
    waypoints: currentRoute.waypoints,
    travelMode: currentRoute.travelMode,
    encodedPolyline: encodedPolyline ?? "",
    legs: currentLegs,
    version: existing ? existing.version + 1 : 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function createNewRoute(travelMode: TravelMode): Route {
  const now = Date.now();
  return {
    id: generateId(),
    name: "",
    waypoints: [],
    legs: [],
    travelMode,
    totalDistanceMeters: 0,
    totalDurationSeconds: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function toRoute(saved: SavedRoute): Route {
  return {
    id: saved.id,
    name: saved.name,
    waypoints: saved.waypoints,
    legs: [],
    travelMode: saved.travelMode,
    totalDistanceMeters: 0,
    totalDurationSeconds: 0,
    createdAt: new Date(saved.createdAt).getTime(),
    updatedAt: new Date(saved.updatedAt).getTime(),
  };
}
