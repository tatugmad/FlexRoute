import type { RouteSortKey, SavedRoute } from "@/types";

function getTotalDistance(route: SavedRoute): number {
  if (!route.legs || route.legs.length === 0) return 0;
  return route.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
}

export function sortRoutes(
  routes: SavedRoute[],
  sortKey: RouteSortKey
): SavedRoute[] {
  return [...routes].sort((a, b) => {
    switch (sortKey) {
      case "updatedAt":
        return b.updatedAt.localeCompare(a.updatedAt);
      case "createdAt":
        return b.createdAt.localeCompare(a.createdAt);
      case "name": {
        const aEmpty = a.name.trim() === "";
        const bEmpty = b.name.trim() === "";
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
        return a.name.localeCompare(b.name, "ja");
      }
      case "distance": {
        const aDist = getTotalDistance(a);
        const bDist = getTotalDistance(b);
        if (aDist === 0 && bDist === 0) return 0;
        if (aDist === 0) return 1;
        if (bDist === 0) return -1;
        return bDist - aDist;
      }
    }
  });
}
