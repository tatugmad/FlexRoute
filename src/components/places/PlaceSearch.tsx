import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { PlaceResultList } from "@/components/places/PlaceResultList";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import { userActionTracker } from "@/services/userActionTracker";
import type { PlaceResult } from "@/types";

type PlaceSearchProps = {
  onClose: () => void;
};

export function PlaceSearch({ onClose }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const addWaypoint = useRouteStore((s) => s.addWaypoint);
  const insertIndex = useUiStore((s) => s.insertIndex);
  const setInsertIndex = useUiStore((s) => s.setInsertIndex);
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(
    null,
  );
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (!google.maps.places) return;
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
    userActionTracker.track("SEARCH_PLACE", { query: input });
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
        userActionTracker.track("SELECT_PLACE", {
          placeId: place.placeId,
          name: detail?.name ?? place.name,
        });
        addWaypoint(
          {
            id: crypto.randomUUID(),
            position: { lat: loc.lat(), lng: loc.lng() },
            label: detail?.name ?? place.name,
            placeId: place.placeId,
          },
          insertIndex ?? undefined,
        );
        setInsertIndex(null);
        onClose();
      },
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="場所を検索..."
          className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <PlaceResultList
        results={results}
        isSearching={isSearching}
        query={query}
        onSelect={handleSelect}
      />
    </div>
  );
}
