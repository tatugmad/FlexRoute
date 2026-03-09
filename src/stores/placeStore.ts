import { create } from "zustand";
import type { PlaceResult } from "@/types";

type PlaceState = {
  query: string;
  results: PlaceResult[];
  selectedPlace: PlaceResult | null;
  isSearching: boolean;
};

type PlaceActions = {
  setQuery: (query: string) => void;
  setResults: (results: PlaceResult[]) => void;
  setSelectedPlace: (place: PlaceResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  reset: () => void;
};

const initialState: PlaceState = {
  query: "",
  results: [],
  selectedPlace: null,
  isSearching: false,
};

export const usePlaceStore = create<PlaceState & PlaceActions>()((set) => ({
  ...initialState,

  setQuery: (query) => set({ query }),

  setResults: (results) => set({ results }),

  setSelectedPlace: (selectedPlace) => set({ selectedPlace }),

  setIsSearching: (isSearching) => set({ isSearching }),

  reset: () => set(initialState),
}));
