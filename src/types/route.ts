import type { LatLng, Waypoint } from "@/types/index";

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
