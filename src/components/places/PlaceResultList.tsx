import { MapPin } from "lucide-react";
import type { PlaceResult } from "@/types";

type PlaceResultListProps = {
  results: PlaceResult[];
  isSearching: boolean;
  query: string;
  onSelect: (place: PlaceResult) => void;
};

export function PlaceResultList({
  results,
  isSearching,
  query,
  onSelect,
}: PlaceResultListProps) {
  if (isSearching) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-400">
        検索中...
      </div>
    );
  }
  if (results.length > 0) {
    return (
      <ul className="bg-white rounded-xl max-h-80 overflow-y-auto">
        {results.map((place) => (
          <li key={place.placeId}>
            <button
              onClick={() => onSelect(place)}
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
    );
  }
  if (query) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-400">
        結果が見つかりません
      </div>
    );
  }
  return (
    <div className="px-4 py-6 text-center text-sm text-slate-400">
      地図をタップしても地点を追加できます
    </div>
  );
}
