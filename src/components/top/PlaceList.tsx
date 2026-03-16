import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { SearchInput } from "@/components/ui/SearchInput";
import { PlaceCard, PlaceRow } from "@/components/top/PlaceCard";
import { useUiStore } from "@/stores/uiStore";
import { usePlaceStore } from "@/stores/placeStore";
import { useLabelStore } from "@/stores/labelStore";
import { matchesQuery } from "@/utils/searchFilter";

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
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <ViewToggle current={viewMode} onChange={setViewMode} />
        <div className="w-full order-last sm:order-none sm:w-auto sm:flex-1 min-w-0">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="場所を検索..." />
        </div>
      </div>

      {savedPlaces.length === 0 ? (
        <EmptyState />
      ) : filteredPlaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="text-sm">一致する場所はありません</p>
        </div>
      ) : viewMode === "tile" ? (
        <div className="grid grid-cols-[repeat(auto-fill,280px)] justify-center gap-3">
          <AnimatePresence mode="popLayout">
            {filteredPlaces.map((place) => (
              <motion.div
                key={place.id}
                exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
              >
                <PlaceCard place={place} onClick={() => openPlaceDetail(place.id)} onDelete={handleDeletePlace} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {filteredPlaces.map((place) => (
              <motion.div
                key={place.id}
                exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
                className="w-full"
              >
                <PlaceRow place={place} onClick={() => openPlaceDetail(place.id)} onDelete={handleDeletePlace} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
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
