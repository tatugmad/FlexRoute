import { MapPin, Trash2 } from "lucide-react";
import { useLabelStore } from "@/stores/labelStore";
import { usePlaceCache } from "@/hooks/usePlaceCache";
import { LabelChip } from "@/components/ui/LabelChip";
import type { SavedPlace } from "@/types";

type PlaceCardProps = {
  place: SavedPlace;
  onClick: () => void;
  onDelete: (id: string) => void;
};

export function PlaceCard({ place, onClick, onDelete }: PlaceCardProps) {
  const labels = useLabelStore((s) => s.labels);
  const placeLabels = labels.filter((l) => place.labelIds.includes(l.id));
  const { photoUrl, refetch } = usePlaceCache(place.placeId, place.id, place.photoUrl, place.originalName);

  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow overflow-hidden text-left flex flex-col">
      <div className="w-full bg-slate-100 flex items-center justify-center overflow-hidden h-[86px] sm:h-[160px]">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" onError={() => refetch()} />
        ) : (
          <MapPin className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-base font-bold text-slate-800 truncate flex-1 mr-2">{place.name}</p>
          <button onClick={(e) => { e.stopPropagation(); onDelete(place.id); }} className="p-1 text-slate-400 hover:text-rose-500 shrink-0" aria-label="削除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] sm:text-sm text-slate-600 mt-0.5 truncate">{place.address}</p>
        {place.memo ? (
          <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5 truncate">{place.memo}</p>
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

export function PlaceRow({ place, onClick, onDelete }: PlaceCardProps) {
  const labels = useLabelStore((s) => s.labels);
  const placeLabels = labels.filter((l) => place.labelIds.includes(l.id));
  const { photoUrl, refetch } = usePlaceCache(place.placeId, place.id, place.photoUrl, place.originalName);

  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow pr-3 text-left flex items-stretch gap-3">
      {/* サムネイル */}
      <div className="w-24 relative rounded-l-2xl bg-slate-100 overflow-hidden shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="absolute inset-0 w-full h-full object-cover" onError={() => refetch()} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
      {/* テキスト部分 */}
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-slate-800 truncate">{place.name}</p>
        <p className="text-sm text-slate-600 mt-0.5 truncate">{place.address}</p>
        {place.memo ? (
          <p className="text-sm text-slate-500 mt-0.5 truncate">{place.memo}</p>
        ) : null}
        {placeLabels.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {placeLabels.map((label) => (
              <LabelChip key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
        )}
      </div>
      {/* 削除ボタン: テキストの外に独立配置 */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(place.id); }}
        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors self-center shrink-0"
        aria-label="削除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </button>
  );
}

