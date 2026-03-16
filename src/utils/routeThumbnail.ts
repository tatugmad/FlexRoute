import {
  generateThumbnailUrl,
  generateMarkerThumbnailUrl,
  generateMapThumbnailUrl,
} from "@/utils/thumbnailUrl";

/** 3段階フォールバックでルートサムネイルURLを生成する */
export function generateRouteThumbnailUrl(
  saved: {
    encodedPolyline: string;
    waypoints: Array<{ position: { lat: number; lng: number } }>;
    mapCenter: { lat: number; lng: number } | null;
    mapZoom: number | null;
    mapWidth: number | null;
    mapHeight: number | null;
  },
  apiKey: string,
): string | null {
  return generateThumbnailUrl(saved.encodedPolyline, apiKey)
    ?? generateMarkerThumbnailUrl(saved.waypoints, saved.mapZoom, saved.mapWidth, saved.mapHeight, apiKey)
    ?? generateMapThumbnailUrl(saved.mapCenter, saved.mapZoom, saved.mapWidth, saved.mapHeight, apiKey);
}
