import type { SavedRoute } from "@/types";

// ── StorageService インターフェース ──

export type StorageService = {
  getRoutes: () => SavedRoute[];
  saveRoute: (route: SavedRoute) => void;
  deleteRoute: (routeId: string) => void;
  getRoute: (routeId: string) => SavedRoute | undefined;
};

// ── localStorage 実装 ──

const STORAGE_KEY = "flexroute:routes";

function readAll(): SavedRoute[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedRoute[];
  } catch {
    return [];
  }
}

function writeAll(routes: SavedRoute[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

export const localStorageService: StorageService = {
  getRoutes: () => readAll(),

  saveRoute: (route) => {
    const routes = readAll();
    const index = routes.findIndex((r) => r.id === route.id);
    if (index >= 0) {
      routes[index] = route;
    } else {
      routes.push(route);
    }
    writeAll(routes);
  },

  deleteRoute: (routeId) => {
    const routes = readAll().filter((r) => r.id !== routeId);
    writeAll(routes);
  },

  getRoute: (routeId) => {
    return readAll().find((r) => r.id === routeId);
  },
};
