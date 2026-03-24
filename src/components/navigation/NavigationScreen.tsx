import { useEffect } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useNavGeolocation } from "@/hooks/useNavGeolocation";
import { NavCurrentLocationMarker } from "@/components/navigation/CurrentLocationMarker";
import { NavHeader } from "@/components/navigation/NavHeader";
import { NavControls } from "@/components/navigation/NavControls";
import { NavRoutePolyline } from "@/components/navigation/NavRoutePolyline";
import { NavCameraSync } from "@/components/navigation/NavCameraSync";
import { SimPositionCross } from "@/components/navigation/SimPositionCross";
import { SimRouteFeeder } from "@/components/navigation/SimRouteFeeder";
import { BugReportButton } from "@/components/navigation/BugReportButton";
import { ZoomInOutButtons } from "@/components/navigation/ZoomInOutButtons";
import { CameraModeSelector } from "@/components/navigation/CameraModeSelector";
import { ZoomDebugOverlay } from "@/components/navigation/ZoomDebugOverlay";
import { StepDebugMarkers } from "@/components/navigation/StepDebugMarkers";
import { OffRouteBanner } from "@/components/navigation/OffRouteBanner";
import { RerouteDialog } from "@/components/navigation/RerouteDialog";
import { useStepProgression } from "@/hooks/useStepProgression";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const mapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string) || "DEMO_MAP_ID";

export function NavigationScreen() {
  return (
    <APIProvider apiKey={apiKey} libraries={["places", "geometry"]}>
      <div className="h-screen w-full relative">
        <NavMap />
        <NavHeader />
        <OffRouteBanner />
        <RerouteDialog />
        <NavControls />
        <BugReportButton />
        <ZoomInOutButtons />
        <CameraModeSelector />
        <ZoomDebugOverlay />
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
    // D-032 + D-037: heading は cameraController が moveCamera で制御
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={15}
      mapId={mapId}
      disableDefaultUI={true}
      gestureHandling="greedy"
      className="w-full h-full"
    >
      <NavMapInitialFit />
      <NavCameraSync />
      <NavRoutePolyline />
      <NavCurrentLocationMarker />
      <NavGeolocationRunner />
      <NavStepProgressionRunner />
      <SimPositionCross />
      <SimRouteFeeder />
      <StepDebugMarkers />
    </Map>
  );
}

function NavGeolocationRunner() {
  useNavGeolocation();
  return null;
}

function NavStepProgressionRunner() {
  const status = useNavigationStore((s) => s.status);
  const currentLegs = useRouteStore((s) => s.currentLegs);
  const position = useNavigationStore((s) => s.currentPosition);
  useStepProgression(
    status === "navigating" ? currentLegs : [],
    status === "navigating" ? position : null,
  );
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
