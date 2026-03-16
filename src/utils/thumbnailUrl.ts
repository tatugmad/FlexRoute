import { decodePolyline, encodePolyline } from "@/utils/polylineCodec";
import { simplifyPolyline } from "@/utils/simplifyPolyline";
import { CARD_WIDTH, CARD_THUMBNAIL_HEIGHT } from "@/constants/cardLayout";

const MAX_URL_LENGTH = 8192;
const DEFAULT_TOLERANCE = 0.0001;
const FALLBACK_TOLERANCE = 0.0005;

type Point = { lat: number; lng: number };

export function generateThumbnailUrl(
  encodedPolyline: string,
  apiKey: string,
): string | null {
  if (!encodedPolyline) return null;

  const points = decodePolyline(encodedPolyline);
  if (points.length === 0) return null;

  const startPoint = points[0] ?? null;
  const endPoint = points[points.length - 1] ?? null;

  const simplified = simplifyPolyline(points, DEFAULT_TOLERANCE);
  const url = buildUrl(
    encodePolyline(simplified), apiKey,
    startPoint, endPoint,
  );

  if (url.length <= MAX_URL_LENGTH) return url;

  const moreSimplified = simplifyPolyline(points, FALLBACK_TOLERANCE);
  const fallbackUrl = buildUrl(
    encodePolyline(moreSimplified), apiKey,
    startPoint, endPoint,
  );

  return fallbackUrl.length <= MAX_URL_LENGTH ? fallbackUrl : null;
}

export function generateMarkerThumbnailUrl(
  waypoints: Array<{ position: { lat: number; lng: number } }>,
  zoom: number | null,
  apiKey: string,
): string | null {
  if (waypoints.length === 0 || zoom == null || !apiKey) return null;
  let url =
    "https://maps.googleapis.com/maps/api/staticmap?" +
    `size=${CARD_WIDTH}x${CARD_THUMBNAIL_HEIGHT}` +
    "&scale=2" +
    "&maptype=roadmap";
  if (waypoints.length === 1) {
    const wp = waypoints[0]!;
    url += `&center=${wp.position.lat},${wp.position.lng}`;
    url += `&zoom=${zoom}`;
    url += `&markers=color:red|${wp.position.lat},${wp.position.lng}`;
  } else {
    const first = waypoints[0]!;
    const last = waypoints[waypoints.length - 1]!;
    url += `&markers=color:green|label:S|${first.position.lat},${first.position.lng}`;
    url += `&markers=color:red|label:G|${last.position.lat},${last.position.lng}`;
  }
  url += `&key=${apiKey}`;
  return url;
}

export function generateMapThumbnailUrl(
  center: { lat: number; lng: number } | null,
  zoom: number | null,
  apiKey: string,
): string | null {
  if (!center || zoom == null || !apiKey) return null;
  const url =
    "https://maps.googleapis.com/maps/api/staticmap?" +
    `size=${CARD_WIDTH}x${CARD_THUMBNAIL_HEIGHT}` +
    "&scale=2" +
    "&maptype=roadmap" +
    `&center=${center.lat},${center.lng}` +
    `&zoom=${zoom}` +
    `&key=${apiKey}`;
  return url;
}

export function migrateThumbnails<T extends {
  thumbnailUrl?: string | null;
  encodedPolyline: string;
  waypoints: Array<{ position: { lat: number; lng: number } }>;
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number | null;
}>(
  routes: T[],
  apiKey: string,
): { routes: T[]; changed: boolean } {
  let changed = false;
  const result = routes.map((r) => {
    if (!r.thumbnailUrl) {
      const url = generateThumbnailUrl(r.encodedPolyline, apiKey)
        ?? generateMarkerThumbnailUrl(r.waypoints, r.mapZoom, apiKey)
        ?? generateMapThumbnailUrl(r.mapCenter, r.mapZoom, apiKey);
      if (url) {
        changed = true;
        return { ...r, thumbnailUrl: url };
      }
    }
    return r;
  });
  return { routes: result, changed };
}

function buildUrl(
  encodedPath: string,
  apiKey: string,
  startPoint: Point | null,
  endPoint: Point | null,
): string {
  let url =
    "https://maps.googleapis.com/maps/api/staticmap?" +
    `size=${CARD_WIDTH}x${CARD_THUMBNAIL_HEIGHT}` +
    "&scale=2" +
    "&maptype=roadmap" +
    `&path=color:0x4F46E5FF|weight:3|enc:${encodedPath}`;

  if (startPoint) {
    url += `&markers=color:green|label:S|${startPoint.lat},${startPoint.lng}`;
  }
  if (endPoint) {
    url += `&markers=color:red|label:G|${endPoint.lat},${endPoint.lng}`;
  }

  url += `&key=${apiKey}`;
  return url;
}
