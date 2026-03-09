import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useUiStore } from "@/stores/uiStore";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string;

export function App() {
  const viewport = useUiStore((s) => s.viewport);

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ width: "100vw", height: "100vh" }}>
        <Map
          defaultCenter={viewport.center}
          defaultZoom={viewport.zoom}
          mapId={mapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
        />
      </div>
    </APIProvider>
  );
}
