import { useEffect, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useNavGeolocation } from "@/hooks/useNavGeolocation";
import { NavCurrentLocationMarker } from "@/components/navigation/CurrentLocationMarker";
import { NavHeader } from "@/components/navigation/NavHeader";
import { NavControls } from "@/components/navigation/NavControls";
import { NavRoutePolyline } from "@/components/navigation/NavRoutePolyline";
import { NavMapController } from "@/components/navigation/NavMapController";
import { shortestDelta } from "@/utils/headingUtils";
import { SimPositionCross } from "@/components/navigation/SimPositionCross";
import { BugReportButton } from "@/components/navigation/BugReportButton";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const mapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string) || "DEMO_MAP_ID";

export function NavigationScreen() {
  return (
    <APIProvider apiKey={apiKey} libraries={["places", "geometry"]}>
      <div className="h-screen w-full relative">
        <NavMap />
        <NavHeader />
        <NavControls />
        <BugReportButton />
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

  const heading = useNavigationStore((s) => s.heading);
  const headingMode = useNavigationStore((s) => s.headingMode);
  const prevHeadingRef = useRef(0);
  const rawHeading = headingMode === "headingUp" ? heading : 0;
  const delta = shortestDelta(prevHeadingRef.current, rawHeading);
  prevHeadingRef.current += delta;
  const mapHeading = prevHeadingRef.current;

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={15}
      heading={mapHeading}
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
      <SimPositionCross />
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
