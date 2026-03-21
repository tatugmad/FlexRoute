import { create } from "zustand";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import { localStorageService } from "@/services/storage";
import type { RouteStoreState } from "@/stores/routeStoreTypes";
import { toSavedRoute, toRoute, createNewRoute, migrateLabelIds } from "@/stores/routeConverters";
import { migrateThumbnails } from "@/utils/thumbnailUrl";
import { generateRouteThumbnailUrl, generateRouteThumbnailUrlSmall } from "@/utils/routeThumbnail";
import { isValidPosition } from "@/utils/validation";

const initialState = {
  currentRoute: null,
  savedRoutes: [],
  travelMode: "DRIVE" as const,
  routeName: "",
  isCalculatingRoute: false,
  routeError: null,
  routeSteps: [],
  encodedPolyline: null,
  currentLegs: [],
  isDirty: false,
  mapCenter: null,
  mapZoom: null,
  mapWidth: null,
  mapHeight: null,
  currentLabelIds: [] as string[],
  skipNextCalculation: false,
};

export const useRouteStore = create<RouteStoreState>()((set, get) => ({
  ...initialState,
  setCurrentRoute: (route) => set({ currentRoute: route }),
  addWaypoint: (waypoint, insertIndex) =>
    set((state) => {
      if (!state.currentRoute) return state;
      if (!isValidPosition(waypoint.position)) {
        fr.warn(C.ROUTE, "wp.invalidPosition", {
          position: waypoint.position, label: waypoint.label,
        });
        return state;
      }
      const normalized = { ...waypoint, placeId: waypoint.placeId || null };
      const wps = [...state.currentRoute.waypoints];
      if (insertIndex !== undefined) {
        wps.splice(insertIndex, 0, normalized);
      } else {
        wps.push(normalized);
      }
      fr.info(C.UI, "wp.added", {
        id: normalized.id, label: normalized.label,
        position: normalized.position, insertIndex,
        wpCount: wps.length,
      });
      return {
        isDirty: true,
        currentRoute: { ...state.currentRoute, waypoints: wps, updatedAt: Date.now() },
      };
    }),
  removeWaypoint: (waypointId) =>
    set((state) => {
      if (!state.currentRoute) return state;
      fr.info(C.UI, "wp.removed", {
        id: waypointId,
        remainingCount: state.currentRoute.waypoints.length - 1,
      });
      return {
        isDirty: true,
        currentRoute: {
          ...state.currentRoute,
          waypoints: state.currentRoute.waypoints.filter((w) => w.id !== waypointId),
          updatedAt: Date.now(),
        },
      };
    }),
  reorderWaypoints: (waypoints) =>
    set((state) => {
      if (!state.currentRoute) return state;
      fr.info(C.UI, "wp.reordered", { count: waypoints.length });
      return {
        isDirty: true,
        currentRoute: { ...state.currentRoute, waypoints, updatedAt: Date.now() },
      };
    }),
  setTravelMode: (travelMode) => set({ travelMode }),
  setRouteName: (routeName) => set({ routeName, isDirty: true }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setRouteError: (routeError) => set({ routeError, isCalculatingRoute: false }),
  setIsCalculatingRoute: (isCalculatingRoute) => set({ isCalculatingRoute }),
  setMapViewState: (center, zoom, width, height) => set({ mapCenter: center, mapZoom: zoom, mapWidth: width, mapHeight: height }),
  clearRouteData: () => set({ routeSteps: [], encodedPolyline: null, routeError: null, currentLegs: [] }),
  setRouteData: (data) => {
    set((state) => ({
      currentRoute: state.currentRoute
        ? { ...state.currentRoute, totalDistanceMeters: data.totalDistanceMeters,
            totalDurationSeconds: data.totalDurationSeconds, updatedAt: Date.now() }
        : null,
      encodedPolyline: data.encodedPolyline, routeSteps: data.steps,
      currentLegs: data.legs, isCalculatingRoute: false, routeError: null, isDirty: true,
    }));
    fr.info(C.ROUTE, "route.calculated", {
      distanceM: data.totalDistanceMeters,
      durationS: data.totalDurationSeconds,
      legs: data.legs.length,
      steps: data.legs.reduce((n, l) => n + l.steps.length, 0),
    });
  },
  saveCurrentRoute: () => {
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
  },

  loadRoute: (id) => {
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
  },

  deleteRoute: (id) => {
    localStorageService.deleteRoute(id);
    set((state) => ({
      savedRoutes: state.savedRoutes.filter((r) => r.id !== id),
    }));
  },

  setCurrentLabelIds: (currentLabelIds) => set({ currentLabelIds, isDirty: true }),

  loadSavedRoutes: () => {
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
  },

  setSkipNextCalculation: (skipNextCalculation) => set({ skipNextCalculation }),
  newRoute: () => {
    fr.info(C.ROUTE, "route.new", { travelMode: get().travelMode });
    set({
      currentRoute: createNewRoute(get().travelMode), routeName: "",
      encodedPolyline: null, routeSteps: [], currentLegs: [], currentLabelIds: [],
      isDirty: false, routeError: null, mapCenter: null, mapZoom: null,
      mapWidth: null, mapHeight: null, skipNextCalculation: false,
    });
  },
  reset: () => set({ ...initialState, skipNextCalculation: false }),
}));
