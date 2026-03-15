import { logService } from "@/services/logService";
import type { SavedPlace } from "@/types";

const STORAGE_KEY = "flexroute:places";

function readAll(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPlace[];
  } catch {
    return [];
  }
}

function writeAll(places: SavedPlace[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

export const placeStorageService = {
  getPlaces: (): SavedPlace[] => {
    const places = readAll();
    logService.info("PLACE_STORAGE", "場所一覧読み込み", { count: places.length });
    return places;
  },

  savePlace: (place: SavedPlace): void => {
    const places = readAll();
    const index = places.findIndex((p) => p.id === place.id);
    if (index >= 0) {
      places[index] = place;
    } else {
      places.push(place);
    }
    writeAll(places);
    logService.info("PLACE_STORAGE", "場所保存", { id: place.id, name: place.name });
  },

  deletePlace: (placeId: string): void => {
    const places = readAll().filter((p) => p.id !== placeId);
    writeAll(places);
    logService.info("PLACE_STORAGE", "場所削除", { id: placeId });
  },

  getPlace: (placeId: string): SavedPlace | undefined => {
    return readAll().find((p) => p.id === placeId);
  },
};
