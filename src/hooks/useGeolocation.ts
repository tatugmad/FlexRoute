import { useEffect, useState } from "react";

import { watchCurrentPosition, clearPositionWatch } from "@/services/geolocation";
import { useNavigationStore } from "@/stores/navigationStore";
import type { LatLng } from "@/types";

type GeolocationState = {
  position: LatLng | null;
  heading: number;
  speed: number;
  error: string | null;
};

export function useGeolocation(): GeolocationState {
  const setCurrentPosition = useNavigationStore((s) => s.setCurrentPosition);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<{
    position: LatLng | null;
    heading: number;
    speed: number;
  }>({ position: null, heading: 0, speed: 0 });

  useEffect(() => {
    const watchId = watchCurrentPosition(
      (result) => {
        const pos: LatLng = { lat: result.lat, lng: result.lng };
        const heading = result.heading ?? 0;
        const speed = result.speed ?? 0;

        setCurrentPosition(pos, heading, speed);
        setLocal({ position: pos, heading, speed });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
    );

    return () => clearPositionWatch(watchId);
  }, [setCurrentPosition]);

  return {
    position: local.position,
    heading: local.heading,
    speed: local.speed,
    error,
  };
}
