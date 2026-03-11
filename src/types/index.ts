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
  placeId: string | null;
  placeData?: PlaceData | null;
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

// ── PlaceActionModal 用 ──
export type PlaceModalData = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  photoUrl: string | null;
  position: LatLng;
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

// ── 道路種別 ──
export type RoadType = "highway" | "national" | "prefectural" | "local";

// ── 保存用ルートステップ ──
export type SavedRouteStep = {
  encodedPolyline: string;
  roadType: RoadType;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
};

export type SavedRouteLeg = {
  startWaypointIndex: number;
  endWaypointIndex: number;
  distanceMeters: number;
  durationSeconds: number;
  steps: SavedRouteStep[];
};

// ── ストレージ ──
export type SavedRoute = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  travelMode: TravelMode;
  encodedPolyline: string;
  legs: SavedRouteLeg[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

// ── Routes API v2 ──
export type {
  RoutesApiLatLng,
  RoutesApiWaypoint,
  ComputeRoutesRequest,
  RoutesApiStep,
  ComputeRoutesResponse,
} from "@/types/routesApi";
