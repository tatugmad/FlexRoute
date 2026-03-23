import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { getRoadColor } from "@/utils/roadType";

export function NavRoutePolyline() {
  const map = useMap();
  const currentLegs = useRouteStore((s) => s.currentLegs);
  const currentStepIndex = useNavigationStore((s) => s.currentStepIndex);
  const reroutePolyline = useNavigationStore((s) => s.reroutePolyline);
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

    // Reroute polyline (gray dashed)
    if (reroutePolyline) {
      const decoded = google.maps.geometry.encoding.decodePath(reroutePolyline);
      const reroute = new google.maps.Polyline({
        path: decoded,
        strokeColor: "#9ca3af",
        strokeWeight: 4,
        strokeOpacity: 0,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8, scale: 3 },
          offset: "0",
          repeat: "15px",
        }],
        map,
      });
      polylinesRef.current.push(reroute);
    }

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, currentLegs, currentStepIndex, reroutePolyline]);

  return null;
}
