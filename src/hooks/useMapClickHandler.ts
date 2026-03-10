import { useCallback } from "react";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import { userActionTracker } from "@/services/userActionTracker";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";

export function useMapClickHandler() {
  const addWaypoint = useRouteStore((s) => s.addWaypoint);
  const viewMode = useUiStore((s) => s.viewMode);

  return useCallback(
    (e: MapMouseEvent) => {
      if (viewMode !== "route") return;

      const latLng = e.detail.latLng;
      if (!latLng) return;

      const position = { lat: latLng.lat, lng: latLng.lng };
      const placeId = e.detail.placeId ?? undefined;
      const wpId = crypto.randomUUID();

      if (placeId) {
        // 経路A: Placeアイコンタップ
        // TODO: PlaceActionModal 実装時に、ここでモーダルを表示し
        //       「経路に追加」選択後に addWaypoint する流れに変更する
        userActionTracker.track("MAP_CLICK_PLACE_ADD_WAYPOINT", {
          position,
          placeId,
        });

        fetchPlaceName(placeId).then((name) => {
          const label =
            name ?? `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}`;
          addWaypoint({ id: wpId, position, label, placeId });
        });
      } else {
        // 経路B: 地図タップ（Placeアイコン以外）
        // 座標ベースのウェイポイント。reverseGeocode は行わない
        const label = `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}`;
        userActionTracker.track("MAP_CLICK_ADD_WAYPOINT", { position });
        addWaypoint({ id: wpId, position, label });
      }
    },
    [viewMode, addWaypoint],
  );
}

async function fetchPlaceName(placeId: string): Promise<string | null> {
  try {
    const { Place } = (await google.maps.importLibrary(
      "places",
    )) as google.maps.PlacesLibrary;
    const place = new Place({ id: placeId });
    await place.fetchFields({ fields: ["displayName"] });
    return place.displayName ?? null;
  } catch {
    return null;
  }
}
