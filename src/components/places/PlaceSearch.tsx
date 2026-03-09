import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, MapPin } from "lucide-react";
import { useRouteStore } from "@/stores/routeStore";
import type { PlaceResult } from "@/types";

type PlaceSearchProps = {
  onClose: () => void;
};

export function PlaceSearch({ onClose }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const addWaypoint = useRouteStore((s) => s.addWaypoint);
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(
    null,
  );
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    serviceRef.current = new google.maps.places.AutocompleteService();
    const div = document.createElement("div");
    placesRef.current = new google.maps.places.PlacesService(div);
  }, []);

  const searchPlaces = useCallback((input: string) => {
    if (!input.trim() || !serviceRef.current) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    serviceRef.current.getPlacePredictions(
      { input, componentRestrictions: { country: "jp" } },
      (predictions) => {
        setIsSearching(false);
        if (!predictions) {
          setResults([]);
          return;
        }
        setResults(
          predictions.slice(0, 5).map((p) => ({
            placeId: p.place_id,
            name: p.structured_formatting.main_text,
            address: p.structured_formatting.secondary_text ?? "",
            position: { lat: 0, lng: 0 },
            types: p.types ?? [],
          })),
        );
      },
    );
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(value), 300);
  };

  const handleSelect = (place: PlaceResult) => {
    if (!placesRef.current) return;
    placesRef.current.getDetails(
      { placeId: place.placeId, fields: ["geometry", "name"] },
      (detail) => {
        const loc = detail?.geometry?.location;
        if (!loc) return;
        addWaypoint({
          id: crypto.randomUUID(),
          position: { lat: loc.lat(), lng: loc.lng() },
          label: detail?.name ?? place.name,
          placeId: place.placeId,
        });
        onClose();
      },
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm bg-slate-900/40"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="場所を検索..."
            className="flex-1 text-sm text-slate-800 outline-none placeholder-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {isSearching && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            検索中...
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto">
            {results.map((place) => (
              <li key={place.placeId}>
                <button
                  onClick={() => handleSelect(place)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {place.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {place.address}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            結果が見つかりません
          </div>
        )}

        {!query && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            地図をタップしても地点を追加できます
          </div>
        )}
      </div>
    </div>
  );
}
