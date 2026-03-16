import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { SearchInput } from "@/components/ui/SearchInput";
import { LabelCard, LabelRow } from "@/components/top/LabelCard";
import { useUiStore } from "@/stores/uiStore";
import { useLabelStore } from "@/stores/labelStore";
import { matchesQuery } from "@/utils/searchFilter";
import type { Label } from "@/types";

export function LabelList() {
  const labels = useLabelStore((s) => s.labels);
  const loadLabels = useLabelStore((s) => s.loadLabels);
  const openLabelModal = useLabelStore((s) => s.openLabelModal);
  const deleteLabel = useLabelStore((s) => s.deleteLabel);
  const openConfirmDialog = useUiStore((s) => s.openConfirmDialog);
  const viewMode = useUiStore((s) => s.labelViewMode);
  const setViewMode = useUiStore((s) => s.setLabelViewMode);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadLabels(); }, [loadLabels]);

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
        <div className="grid grid-cols-[repeat(auto-fill,280px)] justify-center gap-3">
          <AnimatePresence mode="popLayout">
            {filteredLabels.map((label) => (
              <motion.div
                key={label.id}
                exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
              >
                <LabelCard label={label} onEdit={openLabelModal} onDelete={handleDelete} />
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
                <LabelRow label={label} onEdit={openLabelModal} onDelete={handleDelete} />
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
