import { useEffect, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { SearchInput } from "@/components/ui/SearchInput";
import { useUiStore } from "@/stores/uiStore";
import { usePlaceStore } from "@/stores/placeStore";
import { useLabelStore } from "@/stores/labelStore";
import { usePlaceCache } from "@/hooks/usePlaceCache";
import { matchesQuery } from "@/utils/searchFilter";
import type { SavedPlace } from "@/types";

export function PlaceList() {
  const savedPlaces = usePlaceStore((s) => s.savedPlaces);
  const loadPlaces = usePlaceStore((s) => s.loadPlaces);
  const deletePlace = usePlaceStore((s) => s.deletePlace);
  const openPlaceDetail = usePlaceStore((s) => s.openPlaceDetail);
  const labels = useLabelStore((s) => s.labels);
  const openConfirmDialog = useUiStore((s) => s.openConfirmDialog);
  const viewMode = useUiStore((s) => s.placesViewMode);
  const setViewMode = useUiStore((s) => s.setPlacesViewMode);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDeletePlace = (id: string) => {
    const place = savedPlaces.find((p) => p.id === id);
    if (!place) return;
    openConfirmDialog(`「${place.name}」を削除しますか？`, () => deletePlace(id));
  };

  useEffect(() => { loadPlaces(); }, [loadPlaces]);

  const filteredPlaces = savedPlaces.filter((place) => {
    const labelNames = place.labelIds
      .map((id) => labels.find((l) => l.id === id)?.name ?? "")
      .filter(Boolean);
    return matchesQuery(searchQuery, [
      place.name,
      place.address,
      place.memo,
      ...labelNames,
    ]);
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <ViewToggle current={viewMode} onChange={setViewMode} />
      </div>

      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="場所を検索..." />

      {savedPlaces.length === 0 ? (
        <EmptyState />
      ) : filteredPlaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="text-sm">一致する場所はありません</p>
        </div>
      ) : viewMode === "tile" ? (
        <div className="flex flex-wrap gap-3">
          {filteredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} onClick={() => openPlaceDetail(place.id)} onDelete={handleDeletePlace} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredPlaces.map((place) => (
            <PlaceRow key={place.id} place={place} onClick={() => openPlaceDetail(place.id)} onDelete={handleDeletePlace} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceCard({ place, onClick, onDelete }: { place: SavedPlace; onClick: () => void; onDelete: (id: string) => void }) {
  const labels = useLabelStore((s) => s.labels);
  const placeLabels = labels.filter((l) => place.labelIds.includes(l.id));
  const { photoUrl, refetch } = usePlaceCache(place.placeId, place.id, place.photoUrl, place.originalName);

  return (
    <button onClick={onClick} className="w-[280px] bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow overflow-hidden text-left flex flex-col">
      <div className="h-[110px] w-full bg-slate-100 flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" onError={() => refetch()} />
        ) : (
          <MapPin className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-800 truncate flex-1 mr-2">{place.name}</p>
          <button onClick={(e) => { e.stopPropagation(); onDelete(place.id); }} className="p-1 text-slate-400 hover:text-rose-500 shrink-0" aria-label="削除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mt-0.5 truncate">{place.address}</p>
        {place.memo ? (
          <p className="text-sm text-slate-500 mt-0.5 truncate">{place.memo}</p>
        ) : null}
        {placeLabels.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {placeLabels.map((label) => (
              <LabelChip key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function PlaceRow({ place, onClick, onDelete }: { place: SavedPlace; onClick: () => void; onDelete: (id: string) => void }) {
  const labels = useLabelStore((s) => s.labels);
  const placeLabels = labels.filter((l) => place.labelIds.includes(l.id));
  const { photoUrl, refetch } = usePlaceCache(place.placeId, place.id, place.photoUrl, place.originalName);

  return (
    <button onClick={onClick} className="w-full bg-white rounded-xl border border-slate-300 hover:shadow-md transition-shadow px-4 py-3 text-left flex items-center gap-3">
      <div className="w-24 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="w-24 h-16 rounded-lg object-cover shrink-0" onError={() => refetch()} />
        ) : (
          <MapPin className="w-5 h-5 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-800 truncate flex-1 mr-2">{place.name}</p>
          <button onClick={(e) => { e.stopPropagation(); onDelete(place.id); }} className="p-1 text-slate-400 hover:text-rose-500 shrink-0" aria-label="削除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mt-0.5 truncate">{place.address}</p>
        {place.memo ? (
          <p className="text-sm text-slate-500 mt-0.5 truncate">{place.memo}</p>
        ) : null}
        {placeLabels.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {placeLabels.map((label) => (
              <LabelChip key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function LabelChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-sm">保存された場所はありません</p>
      <p className="text-xs mt-1 text-slate-500">
        地図上のPlaceアイコンから場所を保存できます
      </p>
    </div>
  );
}
