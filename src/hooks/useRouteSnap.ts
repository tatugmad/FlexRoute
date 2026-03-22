import { useMemo } from "react";
import { useRouteStore } from "@/stores/routeStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import { closestPointOnSegment } from "@/utils/geometry";
import type { LatLng, SavedRouteLeg } from "@/types";

const SNAP_THRESHOLD_M = 50;

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
      fr.trace(C.SNAP, "snap.hit", {
        distM: Math.round(bestDist * 10) / 10,
      });
      return { lat: bestPoint.lat(), lng: bestPoint.lng() };
    }
    if (bestDist < Infinity) {
      fr.trace(C.SNAP, "snap.miss", {
        distM: Math.round(bestDist * 10) / 10,
      });
    }
    return null;
  }, [position, currentLegs]);
}
