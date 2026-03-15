import { create } from "zustand";
import { placeStorageService } from "@/services/placeStorage";
import { generateId } from "@/utils/generateId";
import { logService } from "@/services/logService";
import type { PlaceResult, PlaceModalData, SavedPlace } from "@/types";

type PlaceState = {
  query: string;
  results: PlaceResult[];
  selectedPlace: PlaceResult | null;
  isSearching: boolean;
  placeModalData: PlaceModalData | null;
  placeModalOpen: boolean;
  savedPlaces: SavedPlace[];
  detailPlaceId: string | null;
};

type PlaceActions = {
  setQuery: (query: string) => void;
  setResults: (results: PlaceResult[]) => void;
  setSelectedPlace: (place: PlaceResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  openPlaceModal: (data: PlaceModalData) => void;
  closePlaceModal: () => void;
  reset: () => void;
  loadPlaces: () => void;
  addPlace: (place: Omit<SavedPlace, "id" | "createdAt" | "updatedAt">) => SavedPlace;
  updatePlace: (id: string, updates: Partial<Pick<SavedPlace, "name" | "userNote" | "labelIds" | "photoUrl">>) => void;
  deletePlace: (id: string) => void;
  isSaved: (googlePlaceId: string) => boolean;
  openPlaceDetail: (id: string) => void;
  closePlaceDetail: () => void;
};

const initialState: PlaceState = {
  query: "",
  results: [],
  selectedPlace: null,
  isSearching: false,
  placeModalData: null,
  placeModalOpen: false,
  savedPlaces: [],
  detailPlaceId: null,
};

export const usePlaceStore = create<PlaceState & PlaceActions>()((set, get) => ({
  ...initialState,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setSelectedPlace: (selectedPlace) => set({ selectedPlace }),
  setIsSearching: (isSearching) => set({ isSearching }),
  openPlaceModal: (data) => set({ placeModalData: data, placeModalOpen: true }),
  closePlaceModal: () => set({ placeModalData: null, placeModalOpen: false }),
  reset: () => set(initialState),

  loadPlaces: () => {
    const savedPlaces = placeStorageService.getPlaces();
    set({ savedPlaces });
  },

  addPlace: (data) => {
    const now = new Date().toISOString();
    const place: SavedPlace = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    placeStorageService.savePlace(place);
    logService.info("PLACE_STORE", "場所追加", { id: place.id, name: place.name });
    set((state) => ({ savedPlaces: [...state.savedPlaces, place] }));
    return place;
  },

  updatePlace: (id, updates) => {
    set((state) => {
      const target = state.savedPlaces.find((p) => p.id === id);
      if (!target) return state;
      const updated: SavedPlace = {
        ...target,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      placeStorageService.savePlace(updated);
      logService.info("PLACE_STORE", "場所更新", { id, updates });
      return { savedPlaces: state.savedPlaces.map((p) => (p.id === id ? updated : p)) };
    });
  },

  deletePlace: (id) => {
    placeStorageService.deletePlace(id);
    logService.info("PLACE_STORE", "場所削除", { id });
    set((state) => ({ savedPlaces: state.savedPlaces.filter((p) => p.id !== id) }));
  },

  isSaved: (googlePlaceId) => {
    return get().savedPlaces.some((p) => p.placeId === googlePlaceId);
  },

  openPlaceDetail: (id) => set({ detailPlaceId: id }),
  closePlaceDetail: () => set({ detailPlaceId: null }),
}));
