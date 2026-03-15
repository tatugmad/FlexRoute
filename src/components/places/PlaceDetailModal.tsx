import { useState } from "react";
import { X, MapPin, Star, Pencil } from "lucide-react";
import { usePlaceStore } from "@/stores/placeStore";
import { useLabelStore } from "@/stores/labelStore";
import { useUiStore } from "@/stores/uiStore";
import { usePlaceCache } from "@/hooks/usePlaceCache";
import { PlaceLabelEditor } from "./PlaceLabelEditor";
import type { SavedPlace } from "@/types";

export function PlaceDetailModal() {
  const detailPlaceId = usePlaceStore((s) => s.detailPlaceId);
  const savedPlaces = usePlaceStore((s) => s.savedPlaces);
  const closePlaceDetail = usePlaceStore((s) => s.closePlaceDetail);

  const place = savedPlaces.find((p) => p.id === detailPlaceId) ?? null;
  if (!place) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={closePlaceDetail}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <PlaceDetailContent place={place} onClose={closePlaceDetail} />
      </div>
    </div>
  );
}

function PlaceDetailContent({ place, onClose }: { place: SavedPlace; onClose: () => void }) {
  const updatePlace = usePlaceStore((s) => s.updatePlace);
  const deletePlace = usePlaceStore((s) => s.deletePlace);
  const openConfirmDialog = useUiStore((s) => s.openConfirmDialog);
  const { photoUrl, refetch } = usePlaceCache(place.placeId, place.id, place.photoUrl, place.originalName);
  const [memo, setMemo] = useState(place.memo);
  const [editingLabels, setEditingLabels] = useState(false);

  const handleMemoBlur = () => {
    if (memo !== place.memo) {
      updatePlace(place.id, { memo });
    }
  };

  const handleDelete = () => {
    openConfirmDialog("この場所を削除しますか？", () => {
      deletePlace(place.id);
      onClose();
    });
  };

  return (
    <>
      <div className="relative h-44 bg-slate-200 flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" onError={() => refetch()} />
        ) : (
          <div className="text-slate-400 flex flex-col items-center gap-1">
            <MapPin className="w-8 h-8" />
            <span className="text-xs">写真なし</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{place.name}</h3>
          {place.originalName && place.originalName !== place.name && (
            <p className="text-xs text-slate-400 mt-0.5">(元の名前: {place.originalName})</p>
          )}
          {place.address && <p className="text-sm text-slate-500 mt-1">{place.address}</p>}
          {place.rating !== null && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-slate-700">{place.rating}</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-slate-600">ラベル</p>
            <button
              onClick={() => setEditingLabels(!editingLabels)}
              className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5"
            >
              <Pencil className="w-3 h-3" />
              {editingLabels ? "閉じる" : "編集"}
            </button>
          </div>
          {editingLabels ? (
            <PlaceLabelEditor place={place} />
          ) : place.labelIds.length > 0 ? (
            <LabelChips place={place} />
          ) : (
            <p className="text-sm text-slate-400">ラベルなし</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">メモ</p>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleMemoBlur}
            placeholder="メモ（任意）"
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
          />
        </div>

        <button
          onClick={handleDelete}
          className="w-full text-rose-500 text-sm font-bold py-2 hover:text-rose-600 transition-colors"
        >
          この場所を削除
        </button>
      </div>
    </>
  );
}

function LabelChips({ place }: { place: SavedPlace }) {
  const labels = useLabelStore((s) => s.labels);
  const placeLabels = labels.filter((l) => place.labelIds.includes(l.id));

  return (
    <div className="flex flex-wrap gap-1.5">
      {placeLabels.map((label) => (
        <span key={label.id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
          {label.name}
        </span>
      ))}
    </div>
  );
}
