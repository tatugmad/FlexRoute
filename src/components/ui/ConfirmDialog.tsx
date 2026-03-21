import { useUiStore } from "@/stores/uiStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

export function ConfirmDialog() {
  const { isOpen, message, onConfirm } = useUiStore((s) => s.confirmDialog);
  const closeConfirmDialog = useUiStore((s) => s.closeConfirmDialog);

  if (!isOpen) return null;

  const handleConfirm = () => {
    fr.info(C.UI, "confirm.ok", { message });
    onConfirm?.();
    closeConfirmDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
        <p className="text-slate-800 text-sm font-medium mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => {
              fr.info(C.UI, "confirm.cancel", { message });
              closeConfirmDialog();
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
