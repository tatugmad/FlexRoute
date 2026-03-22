import { useEffect, useRef } from "react";
import { useSensorStore } from "@/stores/sensorStore";
import { useRouteStore } from "@/stores/routeStore";
import { decodePolyline } from "@/utils/polylineCodec";
import { CHANNEL_NAME } from "@/services/simChannel";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
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

function sendPolyline(ch: BroadcastChannel, legs: SavedRouteLeg[], label: string) {
  if (legs.length === 0) return;
  const points = flattenLegsToPoints(legs);
  ch.postMessage({ type: "route-polyline", points });
  fr.debug(C.SIM, label, { pointCount: points.length });
}

export function SimRouteFeeder() {
  const debugEnabled = useSensorStore((s) => s.debugEnabled);
  const currentLegs = useRouteStore((s) => s.currentLegs);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!debugEnabled) return;
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;
    ch.onmessage = (event) => {
      if (event.data?.type === "remote-ready") {
        const legs = useRouteStore.getState().currentLegs;
        sendPolyline(ch, legs, "simRouteFeeder.resend");
      }
    };
    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, [debugEnabled]);

  useEffect(() => {
    if (!debugEnabled || !channelRef.current) return;
    sendPolyline(channelRef.current, currentLegs, "simRouteFeeder.send");
  }, [debugEnabled, currentLegs]);

  if (!debugEnabled) return null;
  return null;
}
