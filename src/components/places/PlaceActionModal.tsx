import { X, Star, MapPin, Bookmark, Navigation } from "lucide-react";

type PlaceActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PlaceActionModal({ isOpen, onClose }: PlaceActionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-40 bg-slate-200 flex items-center justify-center">
          <div className="text-slate-400 flex flex-col items-center gap-1">
            <MapPin className="w-8 h-8" />
            <span className="text-xs">写真なし</span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold text-slate-800">
            サンプル施設名
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            東京都渋谷区神南1丁目
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-slate-700">4.2</span>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4" />
              経路に追加
            </button>
            <button className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5">
              <Bookmark className="w-4 h-4" />
              場所を保存
            </button>
            <button className="flex-1 bg-slate-300 text-slate-500 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-1.5">
              <Navigation className="w-4 h-4" />
              ナビ開始
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
