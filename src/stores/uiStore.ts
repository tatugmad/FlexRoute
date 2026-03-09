import { create } from "zustand";
import { userActionTracker } from "@/services/userActionTracker";
import type { MapViewport, Panel, ViewMode } from "@/types";

type UiState = {
  viewMode: ViewMode;
  activePanel: Panel;
  isSidebarOpen: boolean;
  viewport: MapViewport;
  isLoading: boolean;
  error: string | null;
};

type UiActions = {
  setViewMode: (mode: ViewMode) => void;
  setActivePanel: (panel: Panel) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setViewport: (viewport: MapViewport) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

const initialState: UiState = {
  viewMode: "top",
  activePanel: "route",
  isSidebarOpen: true,
  viewport: {
    center: { lat: 35.6812, lng: 139.7671 },
    zoom: 14,
  },
  isLoading: false,
  error: null,
};

export const useUiStore = create<UiState & UiActions>()((set) => ({
  ...initialState,

  setViewMode: (viewMode) => {
    userActionTracker.track("SET_VIEW_MODE", { viewMode });
    set({ viewMode });
  },

  setActivePanel: (activePanel) => {
    userActionTracker.track("SET_ACTIVE_PANEL", { activePanel });
    set({ activePanel });
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  setViewport: (viewport) => set({ viewport }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
