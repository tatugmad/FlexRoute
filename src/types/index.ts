// ── ラベル ──
export type Label = {
  id: string;
  name: string;
  color: string;
  forRoute: boolean;
  forPlace: boolean;
  createdAt: string;
  updatedAt: string;
};

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

// ── ルート（src/types/route.ts から re-export） ──
export type {
  TravelMode,
  RouteLeg,
  Route,
  RoadType,
  SavedRouteStep,
  SavedRouteLeg,
  SavedRoute,
} from "@/types/route";

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

export type RouteSortKey = "updatedAt" | "createdAt" | "name" | "distance";

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

// ── 保存済み場所 ──
export type SavedPlace = {
  id: string;
  placeId: string;
  name: string;
  originalName: string | null;
  address: string;
  position: LatLng;
  rating: number | null;
  photoUrl: string | null;
  labelIds: string[];
  memo: string;
  createdAt: string;
  updatedAt: string;
};

// ── 測位品質 ──
export type PositionQuality = 'active' | 'lost';

// ── Routes API v2 ──
export type {
  RoutesApiLatLng,
  RoutesApiWaypoint,
  ComputeRoutesRequest,
  RoutesApiStep,
  ComputeRoutesResponse,
} from "@/types/routesApi";
