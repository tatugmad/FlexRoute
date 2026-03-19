import { useMemo } from "react";
import { useRouteStore } from "@/stores/routeStore";
import type { LatLng, SavedRouteLeg } from "@/types";

const SNAP_THRESHOLD_M = 50;

function closestPointOnSegment(
  p: google.maps.LatLng,
  a: google.maps.LatLng,
  b: google.maps.LatLng,
): { point: google.maps.LatLng; dist: number } {
  const { spherical } = google.maps.geometry;
  const headingAB = spherical.computeHeading(a, b);
  const headingAP = spherical.computeHeading(a, p);
  const distAB = spherical.computeDistanceBetween(a, b);
  const distAP = spherical.computeDistanceBetween(a, p);

  const angleDiff = ((headingAP - headingAB + 360) % 360);
  const angleRad = (angleDiff > 180 ? angleDiff - 360 : angleDiff) * (Math.PI / 180);
  const projection = distAP * Math.cos(angleRad);

  if (projection <= 0) {
    return { point: a, dist: spherical.computeDistanceBetween(p, a) };
  }
  if (projection >= distAB) {
    return { point: b, dist: spherical.computeDistanceBetween(p, b) };
  }

  const snapped = spherical.computeOffset(a, projection, headingAB);
  return { point: snapped, dist: spherical.computeDistanceBetween(p, snapped) };
}

function decodeLegsPolylines(legs: SavedRouteLeg[]): google.maps.LatLng[][] {
  const paths: google.maps.LatLng[][] = [];
  for (const leg of legs) {
    for (const step of leg.steps) {
      const decoded = google.maps.geometry.encoding.decodePath(step.encodedPolyline);
      if (decoded.length > 1) paths.push(decoded);
    }
  }
  return paths;
}

export function useRouteSnap(position: LatLng | null): LatLng | null {
  const currentLegs = useRouteStore((s) => s.currentLegs);

  return useMemo(() => {
    if (!position || currentLegs.length === 0) return null;
    if (typeof google === "undefined" || !google.maps?.geometry) return null;

    const p = new google.maps.LatLng(position.lat, position.lng);
    const paths = decodeLegsPolylines(currentLegs);

    let bestDist = Infinity;
    let bestPoint: google.maps.LatLng | null = null;

    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        if (!a || !b) continue;
        const { point, dist } = closestPointOnSegment(p, a, b);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = point;
        }
      }
    }

    if (bestPoint && bestDist <= SNAP_THRESHOLD_M) {
      return { lat: bestPoint.lat(), lng: bestPoint.lng() };
    }
    return null;
  }, [position, currentLegs]);
}
