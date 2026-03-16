import { useEffect, useRef } from "react";

import { useMap } from "@vis.gl/react-google-maps";

import { useRouteStore } from "@/stores/routeStore";

export function useMapViewState() {
  const map = useMap();
  const setMapViewState = useRouteStore((s) => s.setMapViewState);
  const setIsDirty = useRouteStore((s) => s.setIsDirty);
  const isFirstIdle = useRef(true);

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener("idle", () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (!center || zoom == null) return;

      const latLng = { lat: center.lat(), lng: center.lng() };
      const div = map.getDiv();
      setMapViewState(latLng, zoom, div.clientWidth, div.clientHeight);

      if (isFirstIdle.current) {
        isFirstIdle.current = false;
        return;
      }
      setIsDirty(true);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, setMapViewState, setIsDirty]);
}
