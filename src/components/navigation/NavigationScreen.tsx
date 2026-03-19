import { useEffect } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import { useNavGeolocation } from "@/hooks/useNavGeolocation";
import { NavCurrentLocationMarker } from "@/components/navigation/CurrentLocationMarker";
import { NavHeader } from "@/components/navigation/NavHeader";
import { NavControls } from "@/components/navigation/NavControls";
import { NavRoutePolyline } from "@/components/navigation/NavRoutePolyline";
import { NavMapController } from "@/components/navigation/NavMapController";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const mapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string) || "DEMO_MAP_ID";

export function NavigationScreen() {
  return (
    <APIProvider apiKey={apiKey} libraries={["places", "geometry"]}>
      <div className="h-screen w-full relative">
        <NavMap />
        <NavHeader />
        <NavControls />
      </div>
    </APIProvider>
  );
}

function NavMap() {
  const route = useRouteStore((s) => s.currentRoute);
  const waypoints = route?.waypoints ?? [];
  const defaultCenter = waypoints.length > 0
    ? waypoints[0]!.position
    : { lat: 35.6895, lng: 139.6917 };

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={15}
      mapId={mapId}
      disableDefaultUI={true}
      gestureHandling="greedy"
      className="w-full h-full"
    >
      <NavMapInitialFit />
      <NavMapController />
      <NavRoutePolyline />
      <NavCurrentLocationMarker />
      <NavGeolocationRunner />
    </Map>
  );
}

function NavGeolocationRunner() {
  useNavGeolocation();
  return null;
}

function NavMapInitialFit() {
  const map = useMap();
  const waypoints = useRouteStore((s) => s.currentRoute?.waypoints ?? []);

  useEffect(() => {
    if (!map || waypoints.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    waypoints.forEach((wp) => bounds.extend(wp.position));
    map.fitBounds(bounds, 60);
  }, [map]); // only on mount

  return null;
}
