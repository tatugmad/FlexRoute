import { useEffect, useRef, useState } from "react";

import { startDualWatch, stopDualWatch } from "@/services/geolocation";
import { logService } from "@/services/logService";
import { useNavigationStore } from "@/stores/navigationStore";
import type { LatLng, PositionQuality } from "@/types";

const PRIMARY_SILENCE_THRESHOLD = 5000;
const LOST_THRESHOLD = 15000;
const CHECK_INTERVAL = 1000;

type GeolocationState = {
  position: LatLng | null;
  heading: number;
  speed: number;
  quality: PositionQuality;
  error: string | null;
};

export function useGeolocation(): GeolocationState {
  const setCurrentPosition = useNavigationStore((s) => s.setCurrentPosition);
  const [state, setState] = useState<GeolocationState>({
    position: null,
    heading: 0,
    speed: 0,
    quality: "lost",
    error: null,
  });

  const lastPrimaryAt = useRef(0);
  const lastAdoptedAt = useRef(0);
  const secondaryBuffer = useRef<{ pos: LatLng; heading: number; speed: number } | null>(null);

  useEffect(() => {
    const adopt = (pos: LatLng, heading: number, speed: number, quality: PositionQuality) => {
      lastAdoptedAt.current = Date.now();
      setCurrentPosition(pos, heading, speed, quality);
      setState({ position: pos, heading, speed, quality, error: null });
    };

    const ids = startDualWatch({
      onPrimary: (result) => {
        lastPrimaryAt.current = Date.now();
        const pos: LatLng = { lat: result.lat, lng: result.lng };
        adopt(pos, result.heading ?? 0, result.speed ?? 0, "gps");
      },
      onSecondary: (result) => {
        const pos: LatLng = { lat: result.lat, lng: result.lng };
        const heading = result.heading ?? 0;
        const speed = result.speed ?? 0;
        secondaryBuffer.current = { pos, heading, speed };

        const silenceMs = Date.now() - (lastPrimaryAt.current || 0);
        if (lastPrimaryAt.current === 0 || silenceMs >= PRIMARY_SILENCE_THRESHOLD) {
          adopt(pos, heading, speed, "wifi");
        }
      },
      onPrimaryError: (err) => {
        logService.error("GEO", "主系エラー", err);
        setState((prev) => ({ ...prev, error: err.message }));
      },
      onSecondaryError: (err) => {
        logService.error("GEO", "副系エラー", err);
      },
    });

    const timer = setInterval(() => {
      const now = Date.now();
      if (lastAdoptedAt.current > 0 && now - lastAdoptedAt.current >= LOST_THRESHOLD) {
        setCurrentPosition(
          useNavigationStore.getState().currentPosition!,
          0, 0, "lost",
        );
        setState((prev) => ({ ...prev, quality: "lost" }));
      }
    }, CHECK_INTERVAL);

    return () => {
      stopDualWatch(ids);
      clearInterval(timer);
    };
  }, [setCurrentPosition]);

  return state;
}
