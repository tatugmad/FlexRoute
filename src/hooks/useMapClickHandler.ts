import { useCallback } from "react";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";

export function useMapClickHandler() {
  const addWaypoint = useRouteStore((s) => s.addWaypoint);
  const viewMode = useUiStore((s) => s.viewMode);

  return useCallback(
    (e: MapMouseEvent) => {
      if (viewMode !== "route") return;

      const latLng = e.detail.latLng;
      if (!latLng) return;

      const position = { lat: latLng.lat, lng: latLng.lng };
      const label = `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}`;
      const wpId = crypto.randomUUID();

      addWaypoint({ id: wpId, position, label });

      reverseGeocode(position).then((name) => {
        if (!name) return;
        const route = useRouteStore.getState().currentRoute;
        if (!route) return;
        useRouteStore.getState().setCurrentRoute({
          ...route,
          waypoints: route.waypoints.map((w) =>
            w.id === wpId ? { ...w, label: name } : w,
          ),
        });
      });
    },
    [viewMode, addWaypoint],
  );
}

async function reverseGeocode(position: {
  lat: number;
  lng: number;
}): Promise<string | null> {
  try {
    const geocoder = new google.maps.Geocoder();
    const res = await geocoder.geocode({ location: position });
    const result = res.results[0];
    if (!result) return null;

    const locality =
      result.address_components.find((c) =>
        c.types.includes("sublocality_level_1"),
      )?.long_name ??
      result.address_components.find((c) => c.types.includes("locality"))
        ?.long_name;

    const premise = result.address_components.find(
      (c) =>
        c.types.includes("premise") ||
        c.types.includes("point_of_interest") ||
        c.types.includes("establishment"),
    )?.long_name;

    return (
      premise ?? locality ?? result.formatted_address.split(",")[0] ?? null
    );
  } catch {
    return null;
  }
}
