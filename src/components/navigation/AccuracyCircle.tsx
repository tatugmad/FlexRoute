import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";

export function AccuracyCircle() {
  const map = useMap();
  const accuracy = useNavigationStore((s) => s.accuracy);
  const position = useNavigationStore((s) => s.currentPosition);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      fillColor: "#ffffff",
      fillOpacity: 0.3,
      strokeColor: "#ffffff",
      strokeOpacity: 0.5,
      strokeWeight: 1,
      clickable: false,
      zIndex: 98,
      visible: false,
    });
    circleRef.current = circle;

    let bright = false;
    intervalRef.current = setInterval(() => {
      bright = !bright;
      circle.setOptions({ fillOpacity: bright ? 0.35 : 0.15 });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    if (!position || accuracy == null) {
      circle.setVisible(false);
      return;
    }

    circle.setCenter({ lat: position.lat, lng: position.lng });
    circle.setRadius(accuracy);
    circle.setVisible(true);
  }, [position, accuracy]);

  return null;
}
