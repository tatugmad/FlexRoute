import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { SearchInput } from "@/components/ui/SearchInput";
import { LabelCard, LabelRow } from "@/components/top/LabelCard";
import { useUiStore } from "@/stores/uiStore";
import { useLabelStore } from "@/stores/labelStore";
import { useRouteStore } from "@/stores/routeStore";
import { usePlaceStore } from "@/stores/placeStore";
import { matchesQuery } from "@/utils/searchFilter";
import type { Label, SavedRoute, SavedPlace } from "@/types";

function countLabelUsage(
  labelId: string,
  routes: SavedRoute[],
  places: SavedPlace[],
): number {
  const routeCount = routes.filter((r) => r.labelIds?.includes(labelId)).length;
  const placeCount = places.filter((p) => p.labelIds.includes(labelId)).length;
  return routeCount + placeCount;
}

export function LabelList() {
  const labels = useLabelStore((s) => s.labels);
  const loadLabels = useLabelStore((s) => s.loadLabels);
  const openLabelModal = useLabelStore((s) => s.openLabelModal);
  const deleteLabel = useLabelStore((s) => s.deleteLabel);
  const openConfirmDialog = useUiStore((s) => s.openConfirmDialog);
  const viewMode = useUiStore((s) => s.labelViewMode);
  const setViewMode = useUiStore((s) => s.setLabelViewMode);
  const savedRoutes = useRouteStore((s) => s.savedRoutes);
  const loadSavedRoutes = useRouteStore((s) => s.loadSavedRoutes);
  const savedPlaces = usePlaceStore((s) => s.savedPlaces);
  const loadPlaces = usePlaceStore((s) => s.loadPlaces);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLabels();
    loadSavedRoutes();
    loadPlaces();
  }, [loadLabels, loadSavedRoutes, loadPlaces]);

  const filteredLabels = labels.filter((label) =>
    matchesQuery(searchQuery, [label.name])
  );

  const handleDelete = (label: Label) => {
    openConfirmDialog(`「${label.name}」を削除しますか？`, () => deleteLabel(label.id));
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <ViewToggle current={viewMode} onChange={setViewMode} />
        <div className="w-full order-last sm:order-none sm:w-auto sm:flex-1 min-w-0">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="ラベルを検索..." />
        </div>
        <button
          onClick={() => openLabelModal()}
          className="ml-auto bg-indigo-600 text-white p-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-500 transition-colors flex items-center text-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {labels.length === 0 ? (
        <EmptyState />
      ) : filteredLabels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="text-sm">一致するラベルはありません</p>
        </div>
      ) : viewMode === "tile" ? (
        <div className="grid grid-cols-[repeat(auto-fill,150px)] sm:grid-cols-[repeat(auto-fill,280px)] justify-center gap-2 sm:gap-3">
          <AnimatePresence mode="popLayout">
            {filteredLabels.map((label) => (
              <motion.div
                key={label.id}
                exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
              >
                <LabelCard label={label} count={countLabelUsage(label.id, savedRoutes, savedPlaces)} onEdit={openLabelModal} onDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {filteredLabels.map((label) => (
              <motion.div
                key={label.id}
                exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
                className="w-full"
              >
                <LabelRow label={label} count={countLabelUsage(label.id, savedRoutes, savedPlaces)} onEdit={openLabelModal} onDelete={handleDelete} />
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
      <p className="text-sm">ラベルはまだありません</p>
      <p className="text-xs mt-1 text-slate-500">「+」ボタンからラベルを作成しましょう</p>
    </div>
  );
}
