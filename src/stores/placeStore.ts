import { create } from "zustand";
import { placeStorageService } from "@/services/placeStorage";
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
  savePlace: (place: SavedPlace) => void;
  updatePlace: (id: string, updates: Partial<Pick<SavedPlace, "name" | "memo" | "labelIds" | "photoUrl" | "originalName">>) => void;
  deletePlace: (id: string) => void;
};

const initialState: PlaceState = {
  query: "",
  results: [],
  selectedPlace: null,
  isSearching: false,
  placeModalData: null,
  placeModalOpen: false,
  savedPlaces: [],
};

export const usePlaceStore = create<PlaceState & PlaceActions>()((set) => ({
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

  savePlace: (place) => {
    placeStorageService.savePlace(place);
    logService.info("PLACE_STORE", "場所保存", { id: place.id, name: place.name });
    set((state) => {
      const exists = state.savedPlaces.some((p) => p.id === place.id);
      if (exists) {
        return { savedPlaces: state.savedPlaces.map((p) => (p.id === place.id ? place : p)) };
      }
      return { savedPlaces: [...state.savedPlaces, place] };
    });
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
}));
