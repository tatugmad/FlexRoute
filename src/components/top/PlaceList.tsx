import { useEffect } from "react";
import { MapPin } from "lucide-react";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { useUiStore } from "@/stores/uiStore";
import { usePlaceStore } from "@/stores/placeStore";
import { useLabelStore } from "@/stores/labelStore";
import { usePlaceCache } from "@/hooks/usePlaceCache";
import type { SavedPlace } from "@/types";

export function PlaceList() {
  const savedPlaces = usePlaceStore((s) => s.savedPlaces);
  const loadPlaces = usePlaceStore((s) => s.loadPlaces);
  const openPlaceDetail = usePlaceStore((s) => s.openPlaceDetail);
  const viewMode = useUiStore((s) => s.placesViewMode);
  const setViewMode = useUiStore((s) => s.setPlacesViewMode);

  useEffect(() => { loadPlaces(); }, [loadPlaces]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <ViewToggle current={viewMode} onChange={setViewMode} />
      </div>

      {savedPlaces.length === 0 ? (
        <EmptyState />
      ) : viewMode === "tile" ? (
        <div className="flex flex-wrap gap-3">
          {savedPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} onClick={() => openPlaceDetail(place.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {savedPlaces.map((place) => (
            <PlaceRow key={place.id} place={place} onClick={() => openPlaceDetail(place.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceCard({ place, onClick }: { place: SavedPlace; onClick: () => void }) {
  const labels = useLabelStore((s) => s.labels);
  const placeLabels = labels.filter((l) => place.labelIds.includes(l.id));
  const { photoUrl, refetch } = usePlaceCache(place.placeId, place.id, place.photoUrl, place.originalName);

  return (
    <button onClick={onClick} className="w-[200px] bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow overflow-hidden text-left flex flex-col">
      <div className="h-[150px] w-full bg-slate-100 flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" onError={() => refetch()} />
        ) : (
          <MapPin className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <div className="p-3">
        <p className="text-base font-bold text-slate-800 truncate">{place.name}</p>
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

function PlaceRow({ place, onClick }: { place: SavedPlace; onClick: () => void }) {
  const labels = useLabelStore((s) => s.labels);
  const placeLabels = labels.filter((l) => place.labelIds.includes(l.id));
  const { photoUrl, refetch } = usePlaceCache(place.placeId, place.id, place.photoUrl, place.originalName);

  return (
    <button onClick={onClick} className="w-full bg-white rounded-xl border border-slate-300 hover:shadow-md transition-shadow px-4 py-3 text-left flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" onError={() => refetch()} />
        ) : (
          <MapPin className="w-5 h-5 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-slate-800 truncate">{place.name}</p>
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
