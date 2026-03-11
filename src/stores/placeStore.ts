import { create } from "zustand";
import type { PlaceResult, PlaceModalData } from "@/types";

type PlaceState = {
  query: string;
  results: PlaceResult[];
  selectedPlace: PlaceResult | null;
  isSearching: boolean;
  placeModalData: PlaceModalData | null;
  placeModalOpen: boolean;
};

type PlaceActions = {
  setQuery: (query: string) => void;
  setResults: (results: PlaceResult[]) => void;
  setSelectedPlace: (place: PlaceResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  openPlaceModal: (data: PlaceModalData) => void;
  closePlaceModal: () => void;
  reset: () => void;
};

const initialState: PlaceState = {
  query: "",
  results: [],
  selectedPlace: null,
  isSearching: false,
  placeModalData: null,
  placeModalOpen: false,
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
}));
