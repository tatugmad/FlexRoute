import { MapView } from "@/components/map/MapView";
import { CurrentLocationMarker } from "@/components/map/CurrentLocationMarker";
import { RoutePolyline } from "@/components/map/RoutePolyline";
import { WaypointMarkers } from "@/components/map/WaypointMarkers";
import { RouteEditor } from "@/components/route/RouteEditor";
import { SearchModal } from "@/components/places/SearchModal";
import { TopView } from "@/components/top/TopView";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DebugPanel } from "@/components/ui/DebugPanel";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapClickHandler } from "@/hooks/useMapClickHandler";
import { useUiStore } from "@/stores/uiStore";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

export function App() {
  if (!apiKey) {
    return <ApiKeyError />;
  }

  return (
    <ErrorBoundary>
      <AppRouter />
      <DebugPanel />
    </ErrorBoundary>
  );
}

function AppRouter() {
  const viewMode = useUiStore((s) => s.viewMode);

  if (viewMode === "top") {
    return <TopView />;
  }

  return <RouteScreen />;
}

function RouteScreen() {
  const { position } = useGeolocation();
  const handleMapClick = useMapClickHandler();

  return (
    <div className="h-screen w-full flex">
      <RouteEditor />
      <div className="flex-1 relative">
        <ErrorBoundary fallbackLabel="MapView">
          <MapView center={position ?? undefined} onClick={handleMapClick}>
            {position && <CurrentLocationMarker position={position} />}
            <RoutePolyline />
            <WaypointMarkers />
          </MapView>
        </ErrorBoundary>
      </div>
      <SearchModal />
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
