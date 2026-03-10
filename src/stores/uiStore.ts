import { create } from "zustand";
import { userActionTracker } from "@/services/userActionTracker";
import type { MapViewport, Panel, RouteViewMode, TopTab, ViewMode } from "@/types";

type UiState = {
  viewMode: ViewMode;
  activePanel: Panel;
  isSidebarOpen: boolean;
  viewport: MapViewport;
  isLoading: boolean;
  isMapReady: boolean;
  error: string | null;
  topTab: TopTab;
  routeViewMode: RouteViewMode;
  searchModalOpen: boolean;
  insertIndex: number | null;
};

type UiActions = {
  setViewMode: (mode: ViewMode) => void;
  setActivePanel: (panel: Panel) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setViewport: (viewport: MapViewport) => void;
  setIsLoading: (isLoading: boolean) => void;
  setMapReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  setTopTab: (tab: TopTab) => void;
  setRouteViewMode: (mode: RouteViewMode) => void;
  setSearchModalOpen: (open: boolean) => void;
  setInsertIndex: (index: number | null) => void;
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
  isMapReady: false,
  error: null,
  topTab: "routes",
  routeViewMode: "tile",
  searchModalOpen: false,
  insertIndex: null,
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

  setMapReady: (isMapReady) => set({ isMapReady }),

  setError: (error) => set({ error }),

  setTopTab: (topTab) => set({ topTab }),
  setRouteViewMode: (routeViewMode) => set({ routeViewMode }),
  setSearchModalOpen: (searchModalOpen) => set({ searchModalOpen }),
  setInsertIndex: (insertIndex) => set({ insertIndex }),
}));
