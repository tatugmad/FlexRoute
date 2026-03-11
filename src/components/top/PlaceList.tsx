import { ViewToggle } from "@/components/ui/ViewToggle";
import { useUiStore } from "@/stores/uiStore";

const DUMMY_PLACES = [
  {
    id: "1",
    name: "東京タワー",
    address: "東京都港区芝公園4丁目2-8",
    labels: [{ name: "お気に入り", color: "#ef4444" }],
  },
  {
    id: "2",
    name: "富士山五合目",
    address: "山梨県南都留郡鳴沢村",
    labels: [
      { name: "お気に入り", color: "#ef4444" },
      { name: "キャンプ場", color: "#22c55e" },
    ],
  },
  {
    id: "3",
    name: "草津温泉 湯畑",
    address: "群馬県吾妻郡草津町草津",
    labels: [{ name: "温泉", color: "#3b82f6" }],
  },
  {
    id: "4",
    name: "道の駅 富士吉田",
    address: "山梨県富士吉田市新屋1936-6",
    labels: [{ name: "道の駅", color: "#f59e0b" }],
  },
];

type DummyLabel = { name: string; color: string };

export function PlaceList() {
  const places = DUMMY_PLACES;
  const viewMode = useUiStore((s) => s.placesViewMode);
  const setViewMode = useUiStore((s) => s.setPlacesViewMode);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <ViewToggle current={viewMode} onChange={setViewMode} />
      </div>

      {places.length === 0 ? (
        <EmptyState />
      ) : viewMode === "tile" ? (
        <div className="grid grid-cols-2 gap-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {places.map((place) => (
            <PlaceRow key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}

type PlaceItem = {
  id: string;
  name: string;
  address: string;
  labels: DummyLabel[];
};

function PlaceCard({ place }: { place: PlaceItem }) {
  return (
    <button className="w-full bg-white rounded-2xl border border-slate-300 hover:shadow-xl transition-shadow p-3 text-left flex flex-col">
      <p className="text-base font-bold text-slate-800 truncate">{place.name}</p>
      <p className="text-sm text-slate-600 mt-0.5 truncate">{place.address}</p>
      {place.labels.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {place.labels.map((label) => (
            <LabelChip key={label.name} label={label} />
          ))}
        </div>
      )}
    </button>
  );
}

function PlaceRow({ place }: { place: PlaceItem }) {
  return (
    <button className="w-full bg-white rounded-xl border border-slate-300 hover:shadow-md transition-shadow px-4 py-3 text-left">
      <p className="text-base font-bold text-slate-800">{place.name}</p>
      <p className="text-sm text-slate-600 mt-0.5">{place.address}</p>
      {place.labels.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {place.labels.map((label) => (
            <LabelChip key={label.name} label={label} />
          ))}
        </div>
      )}
    </button>
  );
}

function LabelChip({ label }: { label: DummyLabel }) {
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: label.color }}
      />
      {label.name}
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
