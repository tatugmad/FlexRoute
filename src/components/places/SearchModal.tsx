import { X } from "lucide-react";
import { PlaceSearch } from "@/components/places/PlaceSearch";
import { useUiStore } from "@/stores/uiStore";

export function SearchModal() {
  const searchModalOpen = useUiStore((s) => s.searchModalOpen);
  const setSearchModalOpen = useUiStore((s) => s.setSearchModalOpen);

  if (!searchModalOpen) return null;

  const handleClose = () => setSearchModalOpen(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm bg-slate-900/40"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">経路を追加</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <PlaceSearch onClose={handleClose} />
      </div>
    </div>
  );
}
