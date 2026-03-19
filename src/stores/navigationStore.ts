import { create } from "zustand";
import type { LatLng, NavigationStatus, PositionQuality, FollowMode, ZoomMode, HeadingMode } from "@/types";

type NavigationStoreState = {
  status: NavigationStatus;
  currentLegIndex: number;
  currentPosition: LatLng | null;
  heading: number;
  speed: number;
  accuracy: number | null;
  positionQuality: PositionQuality;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  followMode: FollowMode;
  zoomMode: ZoomMode;
  headingMode: HeadingMode;
};

type NavigationActions = {
  startNavigation: () => void;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  stopNavigation: () => void;
  updatePosition: (position: LatLng) => void;
  setCurrentPosition: (
    position: LatLng,
    heading: number,
    speed: number,
    quality: PositionQuality,
    accuracy: number | null,
  ) => void;
  setCurrentLeg: (index: number) => void;
  setRemaining: (distance: number, duration: number) => void;
  setFollowMode: (mode: FollowMode) => void;
  setZoomMode: (mode: ZoomMode) => void;
  setHeadingMode: (mode: HeadingMode) => void;
};

const initialState: NavigationStoreState = {
  status: "idle",
  currentLegIndex: 0,
  currentPosition: null,
  heading: 0,
  speed: 0,
  accuracy: null,
  positionQuality: "lost",
  remainingDistanceMeters: 0,
  remainingDurationSeconds: 0,
  followMode: "auto",
  zoomMode: "autoZoom",
  headingMode: "northUp",
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

  setCurrentPosition: (position, heading, speed, quality, accuracy) =>
    set({ currentPosition: position, heading, speed, positionQuality: quality, accuracy }),

  setCurrentLeg: (index) => set({ currentLegIndex: index }),

  setRemaining: (distance, duration) =>
    set({
      remainingDistanceMeters: distance,
      remainingDurationSeconds: duration,
    }),

  setFollowMode: (followMode) => set({ followMode }),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setHeadingMode: (headingMode) => set({ headingMode }),
}));
