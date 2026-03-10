import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import type { Waypoint } from "@/types";

const EMPTY_WAYPOINTS: Waypoint[] = [];

function getPinColor(index: number, total: number) {
  if (index === 0) return "#10b981";
  if (index === total - 1) return "#f43f5e";
  return "#f59e0b";
}

function WaypointPin({
  color,
  label,
  scale = 1,
}: {
  color: string;
  label: string;
  scale?: number;
}) {
  const size = 36 * scale;
  return (
    <div
      className="flex flex-col items-center"
      style={{ width: size, marginTop: -size }}
      title={label}
    >
      <svg
        viewBox="0 0 36 48"
        width={size}
        height={size * (48 / 36)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z"
          fill={color}
        />
        <circle cx="18" cy="18" r="7" fill="white" />
      </svg>
    </div>
  );
}

export function WaypointMarkers() {
  const waypoints = useRouteStore(
    (s) => s.currentRoute?.waypoints ?? EMPTY_WAYPOINTS,
  );

  return (
    <>
      {waypoints.map((wp, index) => {
        if (wp.position.lat === 0 && wp.position.lng === 0) return null;

        const color = getPinColor(index, waypoints.length);
        const scale = wp.isCurrentLocation ? 0.7 : 1;

        return (
          <AdvancedMarker key={wp.id} position={wp.position}>
            <WaypointPin color={color} label={wp.label} scale={scale} />
          </AdvancedMarker>
        );
      })}
    </>
  );
}
