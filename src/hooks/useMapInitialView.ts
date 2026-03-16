import { useEffect, useRef } from "react";

import { useMap } from "@vis.gl/react-google-maps";

import { getLastKnownPosition } from "@/services/geolocation";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";

const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = { lat: 35.6895, lng: 139.6917 };
const FIT_BOUNDS_PADDING = 80;

export function useMapInitialView() {
  const map = useMap();
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const setMapReady = useUiStore((s) => s.setMapReady);
  const hasInitialized = useRef(false);

  useEffect(() => {
    setMapReady(false);
    hasInitialized.current = false;
    return () => {
      setMapReady(false);
    };
  }, [setMapReady]);

  // 初期表示（全て同期的に即座に決定）
  useEffect(() => {
    if (!map || hasInitialized.current) return;
    hasInitialized.current = true;

    const waypoints = currentRoute?.waypoints ?? [];

    const mapCenter = useRouteStore.getState().mapCenter;
    const mapZoom = useRouteStore.getState().mapZoom;

    if (mapCenter && mapZoom != null) {
      // 全ケース共通: 保存済みの位置があればそれを復元
      map.setCenter(mapCenter);
      map.setZoom(mapZoom);
    } else if (waypoints.length === 0) {
      // WP0件、保存位置なし: lastKnownPosition またはデフォルト
      const lastKnown = getLastKnownPosition();
      const center = lastKnown
        ? { lat: lastKnown.lat, lng: lastKnown.lng }
        : DEFAULT_CENTER;
      map.setCenter(center);
      map.setZoom(DEFAULT_ZOOM);
    } else if (waypoints.length === 1) {
      // WP1件、保存位置なし: WP座標にセンタリング
      map.setCenter(waypoints[0]!.position);
      map.setZoom(DEFAULT_ZOOM);
    } else {
      // WP2件以上、保存位置なし: 全WPが収まるようにfitBounds
      fitBoundsToWaypoints(map, waypoints);
    }
    setMapReady(true);
  }, [map, currentRoute, setMapReady]);
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
