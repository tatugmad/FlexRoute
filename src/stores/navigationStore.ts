import { create } from "zustand";
import type { LatLng, NavigationStatus } from "@/types";

type NavigationStoreState = {
  status: NavigationStatus;
  currentLegIndex: number;
  currentPosition: LatLng | null;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
};

type NavigationActions = {
  startNavigation: () => void;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  stopNavigation: () => void;
  updatePosition: (position: LatLng) => void;
  setCurrentLeg: (index: number) => void;
  setRemaining: (distance: number, duration: number) => void;
};

const initialState: NavigationStoreState = {
  status: "idle",
  currentLegIndex: 0,
  currentPosition: null,
  remainingDistanceMeters: 0,
  remainingDurationSeconds: 0,
};

export const useNavigationStore = create<
  NavigationStoreState & NavigationActions
>()((set) => ({
  ...initialState,

  startNavigation: () => set({ status: "navigating", currentLegIndex: 0 }),

  pauseNavigation: () => set({ status: "paused" }),

  resumeNavigation: () => set({ status: "navigating" }),

  stopNavigation: () => set(initialState),

  updatePosition: (position) => set({ currentPosition: position }),

  setCurrentLeg: (index) => set({ currentLegIndex: index }),

  setRemaining: (distance, duration) =>
    set({
      remainingDistanceMeters: distance,
      remainingDurationSeconds: duration,
    }),
}));
