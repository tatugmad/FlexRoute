import { useEffect, useRef } from "react";

import { useMap } from "@vis.gl/react-google-maps";

import { useNavigationStore } from "@/stores/navigationStore";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";

const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = { lat: 35.6895, lng: 139.6917 };
const FIT_BOUNDS_PADDING = 80;

export function useMapInitialView() {
  const map = useMap();
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const setMapReady = useUiStore((s) => s.setMapReady);
  const currentPosition = useNavigationStore((s) => s.currentPosition);
  const hasInitialized = useRef(false);
  const hasPannedToPosition = useRef(false);

  useEffect(() => {
    setMapReady(false);
    hasInitialized.current = false;
    hasPannedToPosition.current = false;
    return () => {
      setMapReady(false);
    };
  }, [setMapReady]);

  // 初期表示
  useEffect(() => {
    if (!map || hasInitialized.current) return;
    hasInitialized.current = true;

    const waypoints = currentRoute?.waypoints ?? [];

    if (waypoints.length === 0) {
      if (currentPosition) {
        map.setCenter(currentPosition);
        map.setZoom(DEFAULT_ZOOM);
        hasPannedToPosition.current = true;
      } else {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(DEFAULT_ZOOM);
      }
      setMapReady(true);
    } else if (waypoints.length === 1) {
      map.setCenter(waypoints[0]!.position);
      map.setZoom(DEFAULT_ZOOM);
      setMapReady(true);
    } else {
      fitBoundsToWaypoints(map, waypoints);
      setMapReady(true);
    }
  }, [map, currentRoute, setMapReady, currentPosition]);

  // currentPosition が初めてセットされたら panTo
  useEffect(() => {
    if (!map || hasPannedToPosition.current || !currentPosition) return;
    const waypoints = currentRoute?.waypoints ?? [];
    if (waypoints.length === 0) {
      map.panTo(currentPosition);
      hasPannedToPosition.current = true;
    }
  }, [map, currentPosition, currentRoute]);
}

function fitBoundsToWaypoints(
  map: google.maps.Map,
  waypoints: { position: { lat: number; lng: number } }[],
) {
  const bounds = new google.maps.LatLngBounds();
  for (const wp of waypoints) {
    bounds.extend(wp.position);
  }
  map.fitBounds(bounds, FIT_BOUNDS_PADDING);
}
