import { Map, MapPin } from "lucide-react";
import { useRouteStore } from "@/stores/routeStore";
import { usePlaceStore } from "@/stores/placeStore";
import { useLabelStore } from "@/stores/labelStore";
import { useUiStore } from "@/stores/uiStore";
import type { SavedRoute, SavedPlace } from "@/types";

type Props = {
  labelId: string;
};

export function LabelLinkedItems({ labelId }: Props) {
  const savedRoutes = useRouteStore((s) => s.savedRoutes);
  const savedPlaces = usePlaceStore((s) => s.savedPlaces);

  const linkedRoutes = savedRoutes.filter((r) => r.labelIds?.includes(labelId));
  const linkedPlaces = savedPlaces.filter((p) => p.labelIds.includes(labelId));

  return (
    <div>
      <p className="text-sm font-medium text-slate-600 mb-2">ルート</p>
      {linkedRoutes.length === 0 ? (
        <p className="text-sm text-slate-400">なし</p>
      ) : (
        <div className="flex flex-col gap-2">
          {linkedRoutes.map((route) => (
            <RouteItem key={route.id} route={route} />
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-slate-600 mb-2 mt-4">場所</p>
      {linkedPlaces.length === 0 ? (
        <p className="text-sm text-slate-400">なし</p>
      ) : (
        <div className="flex flex-col gap-2">
          {linkedPlaces.map((place) => (
            <PlaceItem key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}

function RouteItem({ route }: { route: SavedRoute }) {
  const thumb = route.thumbnailUrlSmall ?? route.thumbnailUrl;
  const wpCount = route.waypoints?.length ?? 0;

  const handleClick = () => {
    useLabelStore.getState().closeLabelModal();
    useRouteStore.getState().loadRoute(route.id);
    useUiStore.getState().setViewMode("route");
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-stretch gap-3 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-shadow pr-3 text-left"
    >
      <div className="w-20 relative rounded-l-2xl overflow-hidden bg-slate-100 shrink-0">
        {thumb ? (
          <img src={thumb} alt={route.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Map className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-2">
        <p className="text-sm font-medium text-slate-800 truncate">
          {route.name.trim() || "名称未設定"}
        </p>
        <p className="text-xs text-slate-500">{wpCount}地点</p>
      </div>
    </button>
  );
}

function PlaceItem({ place }: { place: SavedPlace }) {
  const handleClick = () => {
    useLabelStore.getState().closeLabelModal();
    usePlaceStore.getState().openPlaceDetail(place.id);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-stretch gap-3 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-shadow pr-3 text-left"
    >
      <div className="w-20 relative rounded-l-2xl overflow-hidden bg-slate-100 shrink-0">
        {place.photoUrl ? (
          <img src={place.photoUrl} alt={place.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-2">
        <p className="text-sm font-medium text-slate-800 truncate">{place.name}</p>
        {place.address && (
          <p className="text-xs text-slate-500 truncate">{place.address}</p>
        )}
      </div>
    </button>
  );
}
