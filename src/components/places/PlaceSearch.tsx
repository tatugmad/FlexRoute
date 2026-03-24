import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { PlaceResultList } from "@/components/places/PlaceResultList";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import { generateId } from "@/utils/generateId";
import type { PlaceResult } from "@/types";
import {
  initPlacesLib, createSessionToken, fetchSuggestions, resolvePlace,
} from "@/services/placeSuggestService";
import type { SuggestionEntry } from "@/services/placeSuggestService";

type PlaceSearchProps = { onClose: () => void };

export function PlaceSearch({ onClose }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const addWaypoint = useRouteStore((s) => s.addWaypoint);
  const insertIndex = useUiStore((s) => s.insertIndex);
  const setInsertIndex = useUiStore((s) => s.setInsertIndex);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<SuggestionEntry[]>([]);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    initPlacesLib().then((ok) => {
      if (!ok) return;
      tokenRef.current = createSessionToken();
      readyRef.current = true;
    });
  }, []);

  const searchPlaces = useCallback(async (input: string) => {
    if (!input.trim() || !readyRef.current) { setResults([]); return; }
    setIsSearching(true);
    fr.info(C.UI, "search.query", { query: input });
    try {
      const entries = await fetchSuggestions(input, tokenRef.current!);
      suggestionsRef.current = entries;
      setResults(entries.map((e) => ({
        placeId: e.placeId, name: e.name, address: e.address,
        position: { lat: 0, lng: 0 }, types: [],
      })));
      fr.debug(C.PLACE_DETAILS, "search.results", { query: input, count: entries.length });
    } catch (err) {
      fr.warn(C.PLACE_DETAILS, "search.failed", {
        query: input, error: err instanceof Error ? err.message : String(err),
      });
      setResults([]);
    } finally { setIsSearching(false); }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(value), 300);
  };

  const handleSelect = async (place: PlaceResult) => {
    const entry = suggestionsRef.current.find((e) => e.placeId === place.placeId);
    if (!entry) return;
    const resolved = await resolvePlace(entry, place);
    if (!resolved) return;
    addWaypoint(
      { id: generateId(), position: resolved.position, label: resolved.name, placeId: place.placeId },
      insertIndex ?? undefined,
    );
    setInsertIndex(null);
    tokenRef.current = createSessionToken();
    onClose();
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
      <PlaceResultList results={results} isSearching={isSearching} query={query} onSelect={handleSelect} />
    </div>
  );
}
