import { create } from "zustand";
import { userActionTracker } from "@/services/userActionTracker";
import type { MapViewport, Panel, RouteSortKey, RouteViewMode, TopTab, ViewMode } from "@/types";

type ConfirmDialog = {
  isOpen: boolean;
  message: string;
  onConfirm: (() => void) | null;
};

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
  labelViewMode: RouteViewMode;
  placesViewMode: RouteViewMode;
  routeSortKey: RouteSortKey;
  searchModalOpen: boolean;
  insertIndex: number | null;
  confirmDialog: ConfirmDialog;
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
  setLabelViewMode: (mode: RouteViewMode) => void;
  setPlacesViewMode: (mode: RouteViewMode) => void;
  setRouteSortKey: (key: RouteSortKey) => void;
  setSearchModalOpen: (open: boolean) => void;
  setInsertIndex: (index: number | null) => void;
  openConfirmDialog: (message: string, onConfirm: () => void) => void;
  closeConfirmDialog: () => void;
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
  labelViewMode: "tile",
  placesViewMode: "tile",
  routeSortKey: "updatedAt",
  searchModalOpen: false,
  insertIndex: null,
  confirmDialog: { isOpen: false, message: "", onConfirm: null },
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
  setLabelViewMode: (labelViewMode) => set({ labelViewMode }),
  setPlacesViewMode: (placesViewMode) => set({ placesViewMode }),
  setRouteSortKey: (routeSortKey) => set({ routeSortKey }),
  setSearchModalOpen: (searchModalOpen) => set({ searchModalOpen }),
  setInsertIndex: (insertIndex) => set({ insertIndex }),
  openConfirmDialog: (message, onConfirm) =>
    set({ confirmDialog: { isOpen: true, message, onConfirm } }),
  closeConfirmDialog: () =>
    set({ confirmDialog: { isOpen: false, message: "", onConfirm: null } }),
}));
