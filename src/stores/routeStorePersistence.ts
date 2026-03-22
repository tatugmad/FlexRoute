import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import { localStorageService } from "@/services/storage";
import { toSavedRoute, toRoute, migrateLabelIds } from "@/stores/routeConverters";
import { migrateThumbnails } from "@/utils/thumbnailUrl";
import { generateRouteThumbnailUrl, generateRouteThumbnailUrlSmall } from "@/utils/routeThumbnail";
import type { RouteStoreState } from "@/stores/routeStoreTypes";

type Get = () => RouteStoreState;
type Set = (
  partial:
    | Partial<RouteStoreState>
    | ((state: RouteStoreState) => Partial<RouteStoreState>),
) => void;

export function saveCurrentRoute(get: Get, set: Set): void {
  const state = get();
  if (!state.currentRoute) return;
  const saved = toSavedRoute(
    state.currentRoute, state.routeName, state.encodedPolyline,
    state.currentLegs, state.savedRoutes, state.mapCenter, state.mapZoom,
    state.mapWidth, state.mapHeight, state.currentLabelIds,
  );
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  saved.thumbnailUrl = generateRouteThumbnailUrl(saved, apiKey);
  saved.thumbnailUrlSmall = generateRouteThumbnailUrlSmall(saved, apiKey);
  localStorageService.saveRoute(saved);
  const updated = state.savedRoutes.some((r) => r.id === saved.id)
    ? state.savedRoutes.map((r) => (r.id === saved.id ? saved : r))
    : [...state.savedRoutes, saved];
  set({ savedRoutes: updated, isDirty: false });
}

export function loadRoute(get: Get, set: Set, id: string): void {
  const saved = get().savedRoutes.find((r) => r.id === id);
  if (!saved) {
    fr.warn(C.ROUTE, "route.loadNotFound", { id });
    return;
  }
  set({
    currentRoute: toRoute(saved), routeName: saved.name,
    encodedPolyline: saved.encodedPolyline || null, currentLegs: saved.legs ?? [],
    isDirty: false, mapCenter: saved.mapCenter ?? null, mapZoom: saved.mapZoom ?? null,
    currentLabelIds: saved.labelIds ?? [], skipNextCalculation: true,
  });
  fr.info(C.ROUTE, "route.loaded", {
    id, name: saved.name,
    wpCount: saved.waypoints.length,
    hasLegs: (saved.legs?.length ?? 0) > 0,
  });
}

export function deleteRoute(set: Set, id: string): void {
  localStorageService.deleteRoute(id);
  set((state) => ({
    savedRoutes: state.savedRoutes.filter((r) => r.id !== id),
  }));
}

export function loadSavedRoutes(set: Set): void {
  const raw = localStorageService.getRoutes();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { routes, changed } = migrateThumbnails(raw, apiKey);
  const labelMigrated = migrateLabelIds(routes);
  if (changed || labelMigrated) routes.forEach((r) => localStorageService.saveRoute(r));
  set({ savedRoutes: routes });
  fr.debug(C.ROUTE, "route.allLoaded", {
    count: routes.length,
    migrated: changed || labelMigrated,
  });
}
