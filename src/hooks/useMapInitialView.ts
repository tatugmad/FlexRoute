import { useEffect, useRef } from "react";

import { useMap } from "@vis.gl/react-google-maps";

import { useRouteStore } from "@/stores/routeStore";

const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = { lat: 35.6895, lng: 139.6917 };
const FIT_BOUNDS_PADDING = 80;

export function useMapInitialView() {
  const map = useMap();
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!map || hasInitialized.current) return;
    hasInitialized.current = true;

    const waypoints = currentRoute?.waypoints ?? [];

    if (waypoints.length === 0) {
      centerOnCurrentLocation(map);
    } else if (waypoints.length === 1) {
      centerOnSingleWaypoint(map, waypoints[0]!.position);
    } else {
      fitBoundsToWaypoints(map, waypoints);
    }
  }, [map, currentRoute]);
}

function centerOnCurrentLocation(map: google.maps.Map) {
  if (!navigator.geolocation) {
    map.setCenter(DEFAULT_CENTER);
    map.setZoom(DEFAULT_ZOOM);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      map.setZoom(DEFAULT_ZOOM);
    },
    () => {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
    },
  );
}

function centerOnSingleWaypoint(
  map: google.maps.Map,
  position: { lat: number; lng: number },
) {
  map.setCenter(position);
  map.setZoom(DEFAULT_ZOOM);
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
