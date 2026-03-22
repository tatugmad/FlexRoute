import { useEffect, useRef } from "react";
import { useSensorStore } from "@/stores/sensorStore";
import { useRouteStore } from "@/stores/routeStore";
import { decodePolyline } from "@/utils/polylineCodec";
import { CHANNEL_NAME } from "@/services/simChannel";
import type { LatLng, SavedRouteLeg } from "@/types";

function flattenLegsToPoints(legs: SavedRouteLeg[]): LatLng[] {
  const points: LatLng[] = [];
  for (const leg of legs) {
    for (const step of leg.steps) {
      const decoded = decodePolyline(step.encodedPolyline);
      for (const pt of decoded) {
        points.push(pt);
      }
    }
  }
  return points;
}

export function SimRouteFeeder() {
  const debugEnabled = useSensorStore((s) => s.debugEnabled);
  const currentLegs = useRouteStore((s) => s.currentLegs);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!debugEnabled) return;
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [debugEnabled]);

  useEffect(() => {
    if (!debugEnabled || !channelRef.current) return;
    if (currentLegs.length === 0) return;
    const points = flattenLegsToPoints(currentLegs);
    channelRef.current.postMessage({
      type: "route-polyline",
      points,
    });
  }, [debugEnabled, currentLegs]);

  if (!debugEnabled) return null;
  return null;
}
