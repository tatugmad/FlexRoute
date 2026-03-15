import { useState, useEffect } from "react";
import { X, Star, MapPin, Bookmark, Navigation, Check } from "lucide-react";
import { usePlaceStore } from "@/stores/placeStore";
import { useRouteStore } from "@/stores/routeStore";
import { generateId } from "@/utils/generateId";
import { PlaceSaveStep } from "./PlaceSaveStep";

type Step = "actions" | "save";

export function PlaceActionModal() {
  const isOpen = usePlaceStore((s) => s.placeModalOpen);
  const data = usePlaceStore((s) => s.placeModalData);
  const closePlaceModal = usePlaceStore((s) => s.closePlaceModal);
  const addWaypoint = useRouteStore((s) => s.addWaypoint);
  const isSaved = usePlaceStore((s) => s.isSaved);
  const [step, setStep] = useState<Step>("actions");

  useEffect(() => {
    if (!isOpen) setStep("actions");
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const alreadySaved = isSaved(data.placeId);

  const handleAddToRoute = () => {
    addWaypoint({
      id: generateId(),
      position: data.position,
      label: data.name,
      placeId: data.placeId,
      placeData: null,
    });
    closePlaceModal();
  };

  if (step === "save") {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
        onClick={closePlaceModal}
      >
        <div
          className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <PlaceSaveStep
            data={data}
            onBack={() => setStep("actions")}
            onSaved={closePlaceModal}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={closePlaceModal}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-40 bg-slate-200 flex items-center justify-center overflow-hidden">
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 flex flex-col items-center gap-1">
              <MapPin className="w-8 h-8" />
              <span className="text-xs">写真なし</span>
            </div>
          )}
          <button
            onClick={closePlaceModal}
            className="absolute top-3 right-3 p-1.5 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold text-slate-800">{data.name}</h3>
          {data.address && (
            <p className="text-sm text-slate-500 mt-0.5">{data.address}</p>
          )}
          {data.rating !== null && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-slate-700">
                {data.rating}
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddToRoute}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              経路に追加
            </button>
            {alreadySaved ? (
              <button
                disabled
                className="flex-1 bg-slate-200 text-slate-500 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                保存済み
              </button>
            ) : (
              <button
                onClick={() => setStep("save")}
                className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <Bookmark className="w-4 h-4" />
                場所を保存
              </button>
            )}
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
