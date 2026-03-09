import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";

function getPinColor(index: number, total: number) {
  if (index === 0) return "#10b981";
  if (index === total - 1) return "#f43f5e";
  return "#f59e0b";
}

export function WaypointMarkers() {
  const waypoints = useRouteStore(
    (s) => s.currentRoute?.waypoints ?? [],
  );

  return (
    <>
      {waypoints.map((wp, index) => {
        if (wp.position.lat === 0 && wp.position.lng === 0) return null;

        const color = getPinColor(index, waypoints.length);
        const scale = wp.isCurrentLocation ? 0.7 : 1;

        return (
          <AdvancedMarker
            key={wp.id}
            position={wp.position}
          >
            <Pin
              background={color}
              borderColor="white"
              glyphColor="white"
              scale={scale}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}
