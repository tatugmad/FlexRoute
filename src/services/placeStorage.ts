import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { SavedPlace } from "@/types";

const STORAGE_KEY = "flexroute:places";

function readAll(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPlace[];
  } catch (err) {
    fr.error(C.PLACE_STORAGE, "placeStorageService.parseFailed", { err });
    return [];
  }
}

function writeAll(places: SavedPlace[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

export const placeStorageService = {
  getPlaces: (): SavedPlace[] => {
    const places = readAll();
    fr.debug(C.PLACE_STORAGE, "placeStorageService.loaded", { count: places.length });
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
    fr.info(C.PLACE_STORAGE, "placeStorageService.saved", { id: place.id, name: place.name });
  },

  deletePlace: (placeId: string): void => {
    const places = readAll().filter((p) => p.id !== placeId);
    writeAll(places);
    fr.info(C.PLACE_STORAGE, "placeStorageService.deleted", { id: placeId });
  },

  getPlace: (placeId: string): SavedPlace | undefined => {
    return readAll().find((p) => p.id === placeId);
  },

  findByGooglePlaceId: (googlePlaceId: string): SavedPlace | undefined => {
    return readAll().find((p) => p.placeId === googlePlaceId);
  },
};
