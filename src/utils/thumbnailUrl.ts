import { decodePolyline, encodePolyline } from "@/utils/polylineCodec";
import { simplifyPolyline } from "@/utils/simplifyPolyline";

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

  let visibleSw: Point | null = null;
  let visibleNe: Point | null = null;

  if (points.length > 1) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latPad = (maxLat - minLat) * 0.2 || 0.01;
    const lngPad = (maxLng - minLng) * 0.2 || 0.01;
    visibleSw = { lat: minLat - latPad, lng: minLng - lngPad };
    visibleNe = { lat: maxLat + latPad, lng: maxLng + lngPad };
  }

  const simplified = simplifyPolyline(points, DEFAULT_TOLERANCE);
  const url = buildUrl(
    encodePolyline(simplified), apiKey,
    startPoint, endPoint, visibleSw, visibleNe,
  );

  if (url.length <= MAX_URL_LENGTH) return url;

  const moreSimplified = simplifyPolyline(points, FALLBACK_TOLERANCE);
  const fallbackUrl = buildUrl(
    encodePolyline(moreSimplified), apiKey,
    startPoint, endPoint, visibleSw, visibleNe,
  );

  return fallbackUrl.length <= MAX_URL_LENGTH ? fallbackUrl : null;
}

export function migrateThumbnails<T extends { thumbnailUrl?: string | null; encodedPolyline: string }>(
  routes: T[],
  apiKey: string,
): { routes: T[]; changed: boolean } {
  let changed = false;
  const result = routes.map((r) => {
    if (!r.thumbnailUrl && r.encodedPolyline) {
      changed = true;
      return { ...r, thumbnailUrl: generateThumbnailUrl(r.encodedPolyline, apiKey) };
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
  visibleSw: Point | null,
  visibleNe: Point | null,
): string {
  let url =
    "https://maps.googleapis.com/maps/api/staticmap?" +
    "size=600x300" +
    "&maptype=roadmap" +
    `&path=color:0x4F46E5FF|weight:5|enc:${encodedPath}`;

  if (startPoint) {
    url += `&markers=color:green|label:S|${startPoint.lat},${startPoint.lng}`;
  }
  if (endPoint) {
    url += `&markers=color:red|label:G|${endPoint.lat},${endPoint.lng}`;
  }
  if (visibleSw && visibleNe) {
    url += `&visible=${visibleSw.lat},${visibleSw.lng}|${visibleNe.lat},${visibleNe.lng}`;
  }

  url += `&key=${apiKey}`;
  return url;
}
