import { computeRoutes } from "@/services/routeApi";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { LatLng, Waypoint, SavedRouteLeg } from "@/types";

/** Helper: find start point of a step by globalStepIndex */
function findStepStartPoint(legs: SavedRouteLeg[], globalStepIndex: number): LatLng | null {
  let idx = 0;
  for (const leg of legs) {
    for (const step of leg.steps) {
      if (idx === globalStepIndex) {
        const decoded = google.maps.geometry.encoding.decodePath(step.encodedPolyline);
        if (decoded.length > 0) {
          const pt = decoded[0]!;
          return { lat: pt.lat(), lng: pt.lng() };
        }
        return null;
      }
      idx++;
    }
  }
  return null;
}

/** Helper: convert Waypoint to Routes API format */
function toApiWaypoint(wp: Waypoint) {
  return wp.placeId
    ? { placeId: wp.placeId }
    : { location: { latLng: { latitude: wp.position.lat, longitude: wp.position.lng } } };
}

/** Helper: create origin from LatLng */
function toApiOrigin(pos: LatLng) {
  return { location: { latLng: { latitude: pos.lat, longitude: pos.lng } } };
}

/**
 * Choice 1: Back to route
 * Current position → start point of the nearest unpassed step
 */
export async function rerouteBackToRoute(
  currentPosition: LatLng,
  legs: SavedRouteLeg[],
  currentStepIndex: number,
): Promise<string | null> {
  const targetPoint = findStepStartPoint(legs, currentStepIndex);
  if (!targetPoint) return null;

  fr.info(C.NAV, "reroute.backToRoute", { from: currentPosition, to: targetPoint });

  const response = await computeRoutes({
    origin: toApiOrigin(currentPosition),
    destination: { location: { latLng: { latitude: targetPoint.lat, longitude: targetPoint.lng } } },
    travelMode: "DRIVE",
  });
  return response.routes[0]?.polyline?.encodedPolyline ?? null;
}

/**
 * Choice 2: Reroute to next waypoint
 * Current position → next waypoint
 */
export async function rerouteToNextWaypoint(
  currentPosition: LatLng,
  waypoints: Waypoint[],
  currentLegIndex: number,
): Promise<string | null> {
  const nextWpIndex = currentLegIndex + 1;
  if (nextWpIndex >= waypoints.length) return null;

  const nextWp = waypoints[nextWpIndex]!;
  fr.info(C.NAV, "reroute.toNextWaypoint", {
    from: currentPosition, to: nextWp.position, wpLabel: nextWp.label,
  });

  const response = await computeRoutes({
    origin: toApiOrigin(currentPosition),
    destination: toApiWaypoint(nextWp),
    travelMode: "DRIVE",
  });
  return response.routes[0]?.polyline?.encodedPolyline ?? null;
}

/**
 * Choice 3: Reroute to destination
 * Current position → remaining waypoints → destination
 */
export async function rerouteToDestination(
  currentPosition: LatLng,
  waypoints: Waypoint[],
  currentLegIndex: number,
): Promise<string | null> {
  const remainingWps = waypoints.slice(currentLegIndex + 1);
  if (remainingWps.length === 0) return null;

  const destination = remainingWps[remainingWps.length - 1]!;
  const intermediates = remainingWps.slice(0, -1);

  fr.info(C.NAV, "reroute.toDestination", {
    from: currentPosition, remainingWps: remainingWps.length,
  });

  const response = await computeRoutes({
    origin: toApiOrigin(currentPosition),
    destination: toApiWaypoint(destination),
    intermediates: intermediates.length > 0 ? intermediates.map(toApiWaypoint) : undefined,
    travelMode: "DRIVE",
  });
  return response.routes[0]?.polyline?.encodedPolyline ?? null;
}
