import { useEffect, useRef } from "react";

import { useMap } from "@vis.gl/react-google-maps";

import { useNavigationStore } from "@/stores/navigationStore";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";

const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = { lat: 35.6895, lng: 139.6917 };
const FIT_BOUNDS_PADDING = 80;
const COARSE_TIMEOUT = 2000;

export function useMapInitialView() {
  const map = useMap();
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const setMapReady = useUiStore((s) => s.setMapReady);
  const currentPosition = useNavigationStore((s) => s.currentPosition);
  const hasInitialized = useRef(false);

  useEffect(() => {
    setMapReady(false);
    hasInitialized.current = false;
    return () => {
      setMapReady(false);
    };
  }, [setMapReady]);

  useEffect(() => {
    if (!map || hasInitialized.current) return;
    hasInitialized.current = true;

    const waypoints = currentRoute?.waypoints ?? [];

    if (waypoints.length === 0) {
      centerOnCurrentLocation(map, setMapReady, currentPosition);
    } else if (waypoints.length === 1) {
      centerOnSingleWaypoint(map, waypoints[0]!.position);
      setMapReady(true);
    } else {
      fitBoundsToWaypoints(map, waypoints);
      setMapReady(true);
    }
  }, [map, currentRoute, setMapReady, currentPosition]);
}

function centerOnCurrentLocation(
  map: google.maps.Map,
  setMapReady: (ready: boolean) => void,
  cachedPosition: { lat: number; lng: number } | null,
) {
  // navigationStore にすでに現在地がある場合は即座に表示
  if (cachedPosition) {
    map.setCenter(cachedPosition);
    map.setZoom(DEFAULT_ZOOM);
    setMapReady(true);
    return;
  }

  if (!navigator.geolocation) {
    map.setCenter(DEFAULT_CENTER);
    map.setZoom(DEFAULT_ZOOM);
    setMapReady(true);
    return;
  }

  // 段階1: 低精度測位（WiFi/IP）で即座に地図表示
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coarse = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setCenter(coarse);
      map.setZoom(DEFAULT_ZOOM);
      setMapReady(true);
      requestHighAccuracyPosition(map);
    },
    () => {
      // 低精度測位も失敗した場合は東京をデフォルトに
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      setMapReady(true);
      requestHighAccuracyPosition(map);
    },
    { enableHighAccuracy: false, timeout: COARSE_TIMEOUT, maximumAge: 60000 },
  );
}

// 段階2: 高精度測位をバックグラウンドで実行し、取得できたら panTo
function requestHighAccuracyPosition(map: google.maps.Map) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    },
    () => {
      // 高精度測位の失敗は無視（段階1の表示を維持）
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
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
