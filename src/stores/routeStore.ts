import { create } from "zustand";
import { userActionTracker } from "@/services/userActionTracker";
import { localStorageService } from "@/services/storage";
import { logService } from "@/services/logService";
import type { RouteStoreState } from "@/stores/routeStoreTypes";
import { toSavedRoute, toRoute, createNewRoute } from "@/stores/routeConverters";
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
};

export const useRouteStore = create<RouteStoreState>()((set, get) => ({
  ...initialState,

  setCurrentRoute: (route) => set({ currentRoute: route }),

  addWaypoint: (waypoint, insertIndex) =>
    set((state) => {
      if (!state.currentRoute) return state;
      if (!isValidPosition(waypoint.position)) return state;
      const normalized = { ...waypoint, placeId: waypoint.placeId || null };
      const wps = [...state.currentRoute.waypoints];
      if (insertIndex !== undefined) {
        wps.splice(insertIndex, 0, normalized);
      } else {
        wps.push(normalized);
      }
      userActionTracker.track("ADD_WAYPOINT", {
        id: normalized.id, label: normalized.label, insertIndex,
      });
      return {
        isDirty: true,
        currentRoute: { ...state.currentRoute, waypoints: wps, updatedAt: Date.now() },
      };
    }),

  removeWaypoint: (waypointId) =>
    set((state) => {
      if (!state.currentRoute) return state;
      userActionTracker.track("REMOVE_WAYPOINT", { id: waypointId });
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
      userActionTracker.track("REORDER_WAYPOINTS", { count: waypoints.length });
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

  setRouteData: (data) =>
    set((state) => ({
      currentRoute: state.currentRoute
        ? { ...state.currentRoute, totalDistanceMeters: data.totalDistanceMeters,
            totalDurationSeconds: data.totalDurationSeconds, updatedAt: Date.now() }
        : null,
      encodedPolyline: data.encodedPolyline, routeSteps: data.steps,
      currentLegs: data.legs, isCalculatingRoute: false, routeError: null, isDirty: true,
    })),

  saveCurrentRoute: () => {
    const state = get();
    if (!state.currentRoute) return;
    const saved = toSavedRoute(
      state.currentRoute, state.routeName, state.encodedPolyline,
      state.currentLegs, state.savedRoutes, state.mapCenter, state.mapZoom,
      state.mapWidth, state.mapHeight,
    );
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    saved.thumbnailUrl = generateRouteThumbnailUrl(saved, apiKey);
    saved.thumbnailUrlSmall = generateRouteThumbnailUrlSmall(saved, apiKey);
    localStorageService.saveRoute(saved);
    const updated = state.savedRoutes.some((r) => r.id === saved.id)
      ? state.savedRoutes.map((r) => (r.id === saved.id ? saved : r))
      : [...state.savedRoutes, saved];
    set({ savedRoutes: updated, isDirty: false });
    logService.info("ROUTE", "ルート保存完了", { id: saved.id, version: saved.version });
  },

  loadRoute: (id) => {
    const saved = get().savedRoutes.find((r) => r.id === id);
    if (!saved) return;
    set({
      currentRoute: toRoute(saved), routeName: saved.name,
      encodedPolyline: saved.encodedPolyline || null, currentLegs: saved.legs ?? [],
      isDirty: false, mapCenter: saved.mapCenter ?? null, mapZoom: saved.mapZoom ?? null,
    });
    logService.info("ROUTE", "ルート読み込み", { id, name: saved.name });
  },

  deleteRoute: (id) => {
    localStorageService.deleteRoute(id);
    set((state) => ({
      savedRoutes: state.savedRoutes.filter((r) => r.id !== id),
    }));
    logService.info("ROUTE", "ルート削除", { id });
  },

  loadSavedRoutes: () => {
    const raw = localStorageService.getRoutes();
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    const { routes, changed } = migrateThumbnails(raw, apiKey);
    if (changed) routes.forEach((r) => localStorageService.saveRoute(r));
    set({ savedRoutes: routes });
  },

  newRoute: () => set({
    currentRoute: createNewRoute(get().travelMode), routeName: "",
    encodedPolyline: null, routeSteps: [], currentLegs: [],
    isDirty: false, routeError: null, mapCenter: null, mapZoom: null,
    mapWidth: null, mapHeight: null,
  }),
  reset: () => set(initialState),
}));
