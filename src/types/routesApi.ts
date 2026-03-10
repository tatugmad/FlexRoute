import type { LatLng, TravelMode } from "@/types";

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
