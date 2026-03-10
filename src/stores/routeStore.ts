import { create } from "zustand";
import { userActionTracker } from "@/services/userActionTracker";
import { localStorageService } from "@/services/storage";
import { logService } from "@/services/logService";
import type { RouteStoreState } from "@/stores/routeStoreTypes";
import { toSavedRoute, toRoute, createNewRoute } from "@/stores/routeConverters";

function isValidPosition(pos: { lat: number; lng: number }): boolean {
  return Number.isFinite(pos.lat) && Number.isFinite(pos.lng) && !(pos.lat === 0 && pos.lng === 0);
}

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

  setRouteData: (data) =>
    set((state) => ({
      currentRoute: state.currentRoute
        ? {
            ...state.currentRoute,
            totalDistanceMeters: data.totalDistanceMeters,
            totalDurationSeconds: data.totalDurationSeconds,
            updatedAt: Date.now(),
          }
        : null,
      encodedPolyline: data.encodedPolyline,
      routeSteps: data.steps,
      currentLegs: data.legs,
      isCalculatingRoute: false,
      routeError: null,
      isDirty: true,
    })),

  setRouteError: (routeError) => set({ routeError, isCalculatingRoute: false }),
  setIsCalculatingRoute: (isCalculatingRoute) => set({ isCalculatingRoute }),

  clearRouteData: () => set({ routeSteps: [], encodedPolyline: null, routeError: null, currentLegs: [] }),

  saveCurrentRoute: () => {
    const { currentRoute, routeName, encodedPolyline, currentLegs, savedRoutes } = get();
    if (!currentRoute) return;
    const saved = toSavedRoute(currentRoute, routeName, encodedPolyline, currentLegs, savedRoutes);
    localStorageService.saveRoute(saved);
    const updated = savedRoutes.some((r) => r.id === saved.id)
      ? savedRoutes.map((r) => (r.id === saved.id ? saved : r))
      : [...savedRoutes, saved];
    set({ savedRoutes: updated, isDirty: false });
    logService.info("ROUTE", "ルート保存完了", { id: saved.id, version: saved.version });
  },

  loadRoute: (id) => {
    const saved = get().savedRoutes.find((r) => r.id === id);
    if (!saved) return;
    const route = toRoute(saved);
    set({
      currentRoute: route,
      routeName: saved.name,
      encodedPolyline: saved.encodedPolyline || null,
      currentLegs: saved.legs ?? [],
      isDirty: false,
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
    const routes = localStorageService.getRoutes();
    set({ savedRoutes: routes });
  },

  newRoute: () => set({
    currentRoute: createNewRoute(get().travelMode),
    routeName: "", encodedPolyline: null, routeSteps: [],
    currentLegs: [], isDirty: false, routeError: null,
  }),

  reset: () => set(initialState),
}));
