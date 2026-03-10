import { create } from "zustand";
import { userActionTracker } from "@/services/userActionTracker";
import type { Route, RoutesApiStep, TravelMode, Waypoint } from "@/types";

type RouteState = {
  currentRoute: Route | null;
  savedRoutes: Route[];
  travelMode: TravelMode;
  routeName: string;
  isCalculatingRoute: boolean;
  routeError: string | null;
  routeSteps: RoutesApiStep[];
  encodedPolyline: string | null;
};

type RouteActions = {
  setCurrentRoute: (route: Route | null) => void;
  addWaypoint: (waypoint: Waypoint, insertIndex?: number) => void;
  removeWaypoint: (waypointId: string) => void;
  reorderWaypoints: (waypoints: Waypoint[]) => void;
  setTravelMode: (mode: TravelMode) => void;
  setSavedRoutes: (routes: Route[]) => void;
  setRouteName: (name: string) => void;
  setRouteData: (data: {
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    encodedPolyline: string;
    steps: RoutesApiStep[];
  }) => void;
  setRouteError: (error: string | null) => void;
  setIsCalculatingRoute: (isCalculating: boolean) => void;
  clearRouteData: () => void;
  reset: () => void;
};

function isValidPosition(pos: { lat: number; lng: number }): boolean {
  return (
    Number.isFinite(pos.lat) &&
    Number.isFinite(pos.lng) &&
    !(pos.lat === 0 && pos.lng === 0)
  );
}

const initialState: RouteState = {
  currentRoute: null,
  savedRoutes: [],
  travelMode: "DRIVE",
  routeName: "",
  isCalculatingRoute: false,
  routeError: null,
  routeSteps: [],
  encodedPolyline: null,
};

export const useRouteStore = create<RouteState & RouteActions>()((set) => ({
  ...initialState,

  setCurrentRoute: (route) => set({ currentRoute: route }),

  addWaypoint: (waypoint, insertIndex) =>
    set((state) => {
      if (!state.currentRoute) return state;
      if (!isValidPosition(waypoint.position)) return state;
      // placeId の正規化: undefined や空文字列は null に統一
      const normalizedWaypoint = {
        ...waypoint,
        placeId: waypoint.placeId || null,
      };
      const wps = [...state.currentRoute.waypoints];
      if (insertIndex !== undefined) {
        wps.splice(insertIndex, 0, normalizedWaypoint);
      } else {
        wps.push(normalizedWaypoint);
      }
      userActionTracker.track("ADD_WAYPOINT", {
        id: normalizedWaypoint.id,
        label: normalizedWaypoint.label,
        insertIndex,
      });
      return {
        currentRoute: {
          ...state.currentRoute,
          waypoints: wps,
          updatedAt: Date.now(),
        },
      };
    }),

  removeWaypoint: (waypointId) =>
    set((state) => {
      if (!state.currentRoute) return state;
      userActionTracker.track("REMOVE_WAYPOINT", { id: waypointId });
      return {
        currentRoute: {
          ...state.currentRoute,
          waypoints: state.currentRoute.waypoints.filter(
            (w) => w.id !== waypointId,
          ),
          updatedAt: Date.now(),
        },
      };
    }),

  reorderWaypoints: (waypoints) =>
    set((state) => {
      if (!state.currentRoute) return state;
      userActionTracker.track("REORDER_WAYPOINTS", {
        count: waypoints.length,
      });
      return {
        currentRoute: { ...state.currentRoute, waypoints, updatedAt: Date.now() },
      };
    }),

  setTravelMode: (travelMode) => set({ travelMode }),
  setSavedRoutes: (savedRoutes) => set({ savedRoutes }),
  setRouteName: (routeName) => set({ routeName }),

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
      isCalculatingRoute: false,
      routeError: null,
    })),

  setRouteError: (routeError) =>
    set({ routeError, isCalculatingRoute: false }),

  setIsCalculatingRoute: (isCalculatingRoute) =>
    set({ isCalculatingRoute }),

  clearRouteData: () =>
    set({ routeSteps: [], encodedPolyline: null, routeError: null }),

  reset: () => set(initialState),
}));
