import { create } from "zustand";
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
  reset: () => void;
};

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
      const wps = [...state.currentRoute.waypoints];
      if (insertIndex !== undefined) {
        wps.splice(insertIndex, 0, waypoint);
      } else {
        wps.push(waypoint);
      }
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

  reset: () => set(initialState),
}));
