import { MapView } from "@/components/map/MapView";
import { CurrentLocationMarker } from "@/components/map/CurrentLocationMarker";
import { RoutePolyline } from "@/components/map/RoutePolyline";
import { WaypointMarkers } from "@/components/map/WaypointMarkers";
import { RouteEditor } from "@/components/route/RouteEditor";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUiStore } from "@/stores/uiStore";
import { useNewRoute } from "@/hooks/useNewRoute";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

export function App() {
  if (!apiKey) {
    return <ApiKeyError />;
  }

  return <MapScreen />;
}

function MapScreen() {
  const { position } = useGeolocation();
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const createNewRoute = useNewRoute();

  const handleNewRoute = () => {
    createNewRoute();
    setViewMode("route");
  };

  return (
    <div className="h-screen w-full flex">
      {viewMode === "route" && <RouteEditor />}

      <div className="flex-1 relative">
        <MapView center={position ?? undefined}>
          {position && <CurrentLocationMarker position={position} />}
          <RoutePolyline />
          <WaypointMarkers />
        </MapView>

        {viewMode === "top" && (
          <button
            onClick={handleNewRoute}
            className="absolute top-4 left-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 font-medium text-sm shadow-lg transition-colors"
          >
            新規ルート
          </button>
        )}
      </div>
    </div>
  );
}

function ApiKeyError() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="text-4xl mb-4">&#x1f5fa;&#xfe0f;</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          API Key が未設定です
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          環境変数{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">
            VITE_GOOGLE_MAPS_API_KEY
          </code>{" "}
          を設定してください。
        </p>
      </div>
    </div>
  );
}
