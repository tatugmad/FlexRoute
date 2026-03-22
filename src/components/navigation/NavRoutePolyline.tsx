import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { getRoadColor } from "@/utils/roadType";

export function NavRoutePolyline() {
  const map = useMap();
  const currentLegs = useRouteStore((s) => s.currentLegs);
  const currentStepIndex = useNavigationStore((s) => s.currentStepIndex);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    let globalStep = 0;
    for (const leg of currentLegs) {
      for (const step of leg.steps) {
        const color = getRoadColor(step.roadType);
        const opacity = globalStep < currentStepIndex ? 0.3 : 0.8;

        const polyline = new google.maps.Polyline({
          path: google.maps.geometry.encoding.decodePath(step.encodedPolyline),
          strokeColor: color,
          strokeWeight: 6,
          strokeOpacity: opacity,
          map,
        });

        polylinesRef.current.push(polyline);
        globalStep++;
      }
    }

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, currentLegs, currentStepIndex]);

  return null;
}
