import { create } from "zustand";
import type { Route, TravelMode, Waypoint } from "@/types";

type RouteState = {
  currentRoute: Route | null;
  savedRoutes: Route[];
  travelMode: TravelMode;
};

type RouteActions = {
  setCurrentRoute: (route: Route | null) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (waypointId: string) => void;
  reorderWaypoints: (waypoints: Waypoint[]) => void;
  setTravelMode: (mode: TravelMode) => void;
  setSavedRoutes: (routes: Route[]) => void;
  reset: () => void;
};

const initialState: RouteState = {
  currentRoute: null,
  savedRoutes: [],
  travelMode: "DRIVE",
};

export const useRouteStore = create<RouteState & RouteActions>()((set) => ({
  ...initialState,

  setCurrentRoute: (route) => set({ currentRoute: route }),

  addWaypoint: (waypoint) =>
    set((state) => {
      if (!state.currentRoute) return state;
      return {
        currentRoute: {
          ...state.currentRoute,
          waypoints: [...state.currentRoute.waypoints, waypoint],
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
        currentRoute: {
          ...state.currentRoute,
          waypoints,
          updatedAt: Date.now(),
        },
      };
    }),

  setTravelMode: (travelMode) => set({ travelMode }),

  setSavedRoutes: (savedRoutes) => set({ savedRoutes }),

  reset: () => set(initialState),
}));
