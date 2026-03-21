import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
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
  } catch (err) {
    fr.error(C.STORAGE, "storage.routes.parseFailed", { err });
    return [];
  }
}

function writeAll(routes: SavedRoute[]): void {
  const json = JSON.stringify(routes);
  localStorage.setItem(STORAGE_KEY, json);
  fr.debug(C.STORAGE, "storage.routes.written", {
    count: routes.length, bytes: json.length,
  });
}

export const localStorageService: StorageService = {
  getRoutes: () => {
    const routes = readAll();
    fr.debug(C.STORAGE, "storage.routes.loaded", { count: routes.length });
    return routes;
  },

  saveRoute: (route) => {
    const routes = readAll();
    const index = routes.findIndex((r) => r.id === route.id);
    if (index >= 0) {
      routes[index] = route;
    } else {
      routes.push(route);
    }
    writeAll(routes);
    fr.info(C.STORAGE, "storage.route.saved", {
      id: route.id, name: route.name, version: route.version,
      wpCount: route.waypoints.length, hasLegs: (route.legs?.length ?? 0) > 0,
    });
  },

  deleteRoute: (routeId) => {
    const routes = readAll().filter((r) => r.id !== routeId);
    writeAll(routes);
    fr.info(C.STORAGE, "storage.route.deleted", { id: routeId });
  },

  getRoute: (routeId) => {
    return readAll().find((r) => r.id === routeId);
  },
};
