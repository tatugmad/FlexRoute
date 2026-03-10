// ── 座標 ──

export type LatLng = {
  lat: number;
  lng: number;
};

// ── Place データ ──

export type PlaceData = {
  address?: string;
  types?: string[];
  rating?: number;
  phoneNumber?: string;
  websiteUrl?: string;
  openingHours?: string[];
};

// ── ウェイポイント ──

export type Waypoint = {
  id: string;
  position: LatLng;
  label: string;
  placeId?: string;
  placeData?: PlaceData;
  userNote?: string;
  isCurrentLocation?: boolean;
};

// ── ルート ──

export type TravelMode = "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT";

export type RouteLeg = {
  startLocation: LatLng;
  endLocation: LatLng;
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
};

export type Route = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  legs: RouteLeg[];
  travelMode: TravelMode;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  createdAt: number;
  updatedAt: number;
};

// ── ナビゲーション ──

export type NavigationStatus = "idle" | "navigating" | "paused" | "arrived";

export type NavigationState = {
  status: NavigationStatus;
  currentLegIndex: number;
  currentPosition: LatLng | null;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
};

// ── 場所検索 ──

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  position: LatLng;
  types: string[];
};

// ── UI 状態 ──

export type ViewMode = "top" | "route";

export type TopTab = "routes" | "labels" | "places";

export type RouteViewMode = "tile" | "list";

export type Panel = "route" | "search" | "navigation" | "settings";

export type MapViewport = {
  center: LatLng;
  zoom: number;
};

// ── ログ ──

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  component?: string;
};

export type UserAction = {
  timestamp: string;
  action: string;
  detail?: unknown;
};

export type PerformanceMetric = {
  count: number;
  avg: number;
  min: number;
  max: number;
};

// ── ストレージ ──

export type SavedRoute = Pick<
  Route,
  "id" | "name" | "waypoints" | "travelMode" | "createdAt" | "updatedAt"
>;

// ── Routes API v2 ──

export type RoutesApiLatLng = {
  latitude: number;
  longitude: number;
};

export type RoutesApiWaypoint = {
  location?: { latLng: RoutesApiLatLng };
  placeId?: string;
};

export type ComputeRoutesRequest = {
  origin: RoutesApiWaypoint;
  destination: RoutesApiWaypoint;
  intermediates?: RoutesApiWaypoint[];
  travelMode: TravelMode;
  routingPreference?: "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL";
  computeAlternativeRoutes?: boolean;
};

export type RoutesApiStep = {
  polyline: { encodedPolyline: string };
  navigationInstruction?: { instructions: string };
};

export type ComputeRoutesResponse = {
  routes: Array<{
    legs: Array<{
      startLocation: { latLng: LatLng };
      endLocation: { latLng: LatLng };
      distanceMeters: number;
      duration: string;
      polyline: { encodedPolyline: string };
      steps: RoutesApiStep[];
    }>;
    distanceMeters: number;
    duration: string;
    polyline: { encodedPolyline: string };
  }>;
};
