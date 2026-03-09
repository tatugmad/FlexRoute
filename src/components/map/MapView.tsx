import type { ReactNode } from "react";

import { Map } from "@vis.gl/react-google-maps";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";

const mapId =
  (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string) || "DEMO_MAP_ID";

const DEFAULT_CENTER = { lat: 35.6895, lng: 139.6917 };
const DEFAULT_ZOOM = 13;

type MapViewProps = {
  center?: { lat: number; lng: number };
  onClick?: (e: MapMouseEvent) => void;
  children?: ReactNode;
};

export function MapView({ center, onClick, children }: MapViewProps) {
  return (
    <Map
      defaultCenter={center ?? DEFAULT_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      mapId={mapId}
      disableDefaultUI={true}
      gestureHandling="greedy"
      className="w-full h-full"
      onClick={onClick}
    >
      {children}
    </Map>
  );
}
