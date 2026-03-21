import { create } from "zustand";
import type { SensorChannelModes, SensorMode, SimValues } from "@/types";

type SensorStoreState = {
  debugEnabled: boolean;
  channelModes: SensorChannelModes;
  simValues: SimValues;
  setChannelMode: (channel: keyof SensorChannelModes, mode: SensorMode, initialPosition?: { lat: number; lng: number } | null) => void;
  setSimPosition: (lat: number, lng: number) => void;
  setSimHeading: (heading: number) => void;
  setSimSpeed: (speed: number) => void;
  setSimAccuracy: (accuracy: number) => void;
  setSimCallbackInterval: (ms: number) => void;
  setSimDenied: (denied: boolean) => void;
  setDebugEnabled: (enabled: boolean) => void;
  resetAllToReal: () => void;
};

const DEFAULT_CHANNEL_MODES: SensorChannelModes = {
  position: 'real',
  heading: 'real',
  speed: 'real',
  network: 'real',
  battery: 'real',
  orientation: 'real',
};

const DEFAULT_SIM_VALUES: SimValues = {
  position: null,
  heading: 0,
  speed: 0,
  accuracy: 10,
  callbackIntervalMs: 1000,
  denied: false,
};

export const useSensorStore = create<SensorStoreState>((set) => ({
  debugEnabled: new URLSearchParams(window.location.search).has('debug'),
  channelModes: { ...DEFAULT_CHANNEL_MODES },
  simValues: { ...DEFAULT_SIM_VALUES },

  setChannelMode: (channel, mode, initialPosition) =>
    set((state) => ({
      channelModes: { ...state.channelModes, [channel]: mode },
      simValues:
        channel === 'position' && mode === 'sim' && initialPosition
          ? { ...state.simValues, position: initialPosition, denied: false }
          : state.simValues,
    })),

  setSimPosition: (lat, lng) =>
    set((state) => ({
      simValues: { ...state.simValues, position: { lat, lng } },
    })),

  setSimHeading: (heading) =>
    set((state) => ({
      simValues: { ...state.simValues, heading },
    })),

  setSimSpeed: (speed) =>
    set((state) => ({
      simValues: { ...state.simValues, speed },
    })),

  setSimAccuracy: (accuracy) =>
    set((state) => ({
      simValues: { ...state.simValues, accuracy },
    })),

  setSimCallbackInterval: (ms) =>
    set((state) => ({
      simValues: { ...state.simValues, callbackIntervalMs: ms },
    })),

  setSimDenied: (denied) =>
    set((state) => ({
      simValues: { ...state.simValues, denied },
    })),

  setDebugEnabled: (enabled) => set({ debugEnabled: enabled }),

  resetAllToReal: () =>
    set({ channelModes: { ...DEFAULT_CHANNEL_MODES } }),
}));
