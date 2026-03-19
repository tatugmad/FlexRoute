import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import { classifyRoadType, getRoadColor } from "@/utils/roadType";

export function NavRoutePolyline() {
  const map = useMap();
  const steps = useRouteStore((s) => s.routeSteps);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    for (const step of steps) {
      const instruction = String(step.navigationInstruction?.instructions ?? "");
      const roadType = classifyRoadType(instruction);
      const color = getRoadColor(roadType);

      const polyline = new google.maps.Polyline({
        path: google.maps.geometry.encoding.decodePath(step.polyline.encodedPolyline),
        strokeColor: color,
        strokeWeight: 6,
        strokeOpacity: 0.8,
        map,
      });

      polylinesRef.current.push(polyline);
    }

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, steps]);

  return null;
}
