import { create } from "zustand";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { LatLng, NavigationStatus, PositionQuality, FollowMode, ZoomMode, HeadingMode, StepPassage } from "@/types";

type NavigationStoreState = {
  status: NavigationStatus;
  currentLegIndex: number;
  currentPosition: LatLng | null;
  heading: number;
  speed: number;
  accuracy: number | null;
  positionQuality: PositionQuality;
  lostSince: string | null;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  followMode: FollowMode;
  zoomMode: ZoomMode;
  headingMode: HeadingMode;
  currentStepIndex: number;
  stepPassages: StepPassage[];
  nextInstruction: string | null;
  distanceToNextStepM: number;
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
  advanceStep: (passage: StepPassage) => void;
  setNextInstruction: (instruction: string | null, distanceM: number) => void;
  resetStepProgression: () => void;
};

const initialState: NavigationStoreState = {
  status: "idle",
  currentLegIndex: 0,
  currentPosition: null,
  heading: 0,
  speed: 0,
  accuracy: null,
  positionQuality: "lost",
  lostSince: null,
  remainingDistanceMeters: 0,
  remainingDurationSeconds: 0,
  followMode: "auto",
  zoomMode: "autoZoom",
  headingMode: "northUp",
  currentStepIndex: 0,
  stepPassages: [],
  nextInstruction: null,
  distanceToNextStepM: 0,
};

export const useNavigationStore = create<
  NavigationStoreState & NavigationActions
>()((set) => ({
  ...initialState,

  startNavigation: () => {
    fr.info(C.NAV, "nav.started", {});
    set({ status: "navigating", currentLegIndex: 0, currentStepIndex: 0, stepPassages: [], nextInstruction: null, distanceToNextStepM: 0 });
  },

  pauseNavigation: () => {
    fr.info(C.NAV, "nav.paused", {});
    set({ status: "paused" });
  },

  resumeNavigation: () => {
    fr.info(C.NAV, "nav.resumed", {});
    set({ status: "navigating" });
  },

  stopNavigation: () => {
    fr.info(C.NAV, "nav.stopped", {});
    set(initialState);
  },

  updatePosition: (position) => set({ currentPosition: position }),

  setCurrentPosition: (position, heading, speed, quality, accuracy) =>
    set({ currentPosition: position, heading, speed, positionQuality: quality, accuracy }),

  setCurrentLeg: (index) => set({ currentLegIndex: index }),

  setRemaining: (distance, duration) =>
    set({
      remainingDistanceMeters: distance,
      remainingDurationSeconds: duration,
    }),

  setFollowMode: (followMode) => {
    fr.debug(C.NAV, "nav.followMode", { followMode });
    set({ followMode });
  },
  setZoomMode: (zoomMode) => {
    fr.debug(C.NAV, "nav.zoomMode", { zoomMode });
    set({ zoomMode });
  },
  setHeadingMode: (headingMode) => {
    fr.debug(C.NAV, "nav.headingMode", { headingMode });
    set({ headingMode });
  },
  advanceStep: (passage) =>
    set((state) => ({
      stepPassages: [...state.stepPassages, passage],
      currentStepIndex: state.currentStepIndex + 1,
    })),
  setNextInstruction: (instruction, distanceM) =>
    set({ nextInstruction: instruction, distanceToNextStepM: distanceM }),
  resetStepProgression: () =>
    set({ currentStepIndex: 0, stepPassages: [], nextInstruction: null, distanceToNextStepM: 0 }),
}));
