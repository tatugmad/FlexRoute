import { useCallback } from "react";
import { useRouteStore } from "@/stores/routeStore";
import { useUiStore } from "@/stores/uiStore";
import { usePlaceStore } from "@/stores/placeStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import { generateId } from "@/utils/generateId";
import { fetchPlaceDetails } from "@/services/placeDetailsService";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";

export function useMapClickHandler() {
  const addWaypoint = useRouteStore((s) => s.addWaypoint);
  const viewMode = useUiStore((s) => s.viewMode);
  const openPlaceModal = usePlaceStore((s) => s.openPlaceModal);

  return useCallback(
    (e: MapMouseEvent) => {
      if (viewMode !== "route") return;

      const latLng = e.detail.latLng;
      if (!latLng) return;

      const position = { lat: latLng.lat, lng: latLng.lng };
      const placeId = e.detail.placeId ?? null;

      if (placeId) {
        // 経路A: Placeアイコンタップ
        // Places API で詳細情報を取得 → PlaceActionModal を表示
        fr.info(C.UI, "map.clickPlace", { position, placeId });

        fetchPlaceDetails(placeId).then((placeData) => {
          openPlaceModal({
            placeId,
            name:
              placeData.name ??
              `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}`,
            address: placeData.address ?? "",
            rating: placeData.rating ?? null,
            photoUrl: placeData.photoUrl ?? null,
            position,
          });
        }).catch((err) => {
          fr.error(C.PLACE_DETAILS, "placeDetails.fetchError", {
            placeId,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      } else {
        // 経路B: 地図タップ（Placeアイコン以外）
        // reverseGeocode は呼ばない。Places API も呼ばない。
        // 座標のみをウェイポイント名にする。
        const label = `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}`;
        const wpId = generateId();
        fr.info(C.UI, "map.clickAddWp", { position });
        addWaypoint({
          id: wpId,
          position,
          label,
          placeId: null,
          placeData: null,
        });
      }
    },
    [viewMode, addWaypoint, openPlaceModal],
  );
}
