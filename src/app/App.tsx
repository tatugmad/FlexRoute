import { MapView } from "@/components/map/MapView";
import { CurrentLocationMarker } from "@/components/map/CurrentLocationMarker";
import { useGeolocation } from "@/hooks/useGeolocation";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

export function App() {
  if (!apiKey) {
    return <ApiKeyError />;
  }

  return <MapScreen />;
}

function MapScreen() {
  const { position } = useGeolocation();

  return (
    <div className="h-screen w-full">
      <MapView center={position ?? undefined}>
        {position && <CurrentLocationMarker position={position} />}
      </MapView>
    </div>
  );
}

function ApiKeyError() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          API Key が未設定です
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          環境変数 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</code> を設定してください。
        </p>
      </div>
    </div>
  );
}
