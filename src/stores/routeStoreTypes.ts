import type {
  LatLng,
  Route,
  RoutesApiStep,
  SavedRoute,
  SavedRouteLeg,
  TravelMode,
  Waypoint,
} from "@/types";

export type RouteStoreState = {
  currentRoute: Route | null;
  savedRoutes: SavedRoute[];
  travelMode: TravelMode;
  routeName: string;
  isCalculatingRoute: boolean;
  routeError: string | null;
  routeSteps: RoutesApiStep[];
  encodedPolyline: string | null;
  currentLegs: SavedRouteLeg[];
  isDirty: boolean;
  mapCenter: LatLng | null;
  mapZoom: number | null;
  mapWidth: number | null;
  mapHeight: number | null;
  skipNextCalculation: boolean;
  setCurrentRoute: (route: Route | null) => void;
  addWaypoint: (waypoint: Waypoint, insertIndex?: number) => void;
  removeWaypoint: (waypointId: string) => void;
  reorderWaypoints: (waypoints: Waypoint[]) => void;
  setTravelMode: (mode: TravelMode) => void;
  setRouteName: (name: string) => void;
  setRouteData: (data: {
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    encodedPolyline: string;
    steps: RoutesApiStep[];
    legs: SavedRouteLeg[];
  }) => void;
  setRouteError: (error: string | null) => void;
  setIsCalculatingRoute: (isCalculating: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  setMapViewState: (center: LatLng, zoom: number, width: number, height: number) => void;
  clearRouteData: () => void;
  saveCurrentRoute: () => void;
  loadRoute: (id: string) => void;
  deleteRoute: (id: string) => void;
  loadSavedRoutes: () => void;
  newRoute: () => void;
  setSkipNextCalculation: (skip: boolean) => void;
  reset: () => void;
};
