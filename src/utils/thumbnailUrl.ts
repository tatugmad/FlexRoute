import { decodePolyline, encodePolyline } from "@/utils/polylineCodec";
import { simplifyPolyline } from "@/utils/simplifyPolyline";

const MAX_URL_LENGTH = 8192;
const DEFAULT_TOLERANCE = 0.0001;
const FALLBACK_TOLERANCE = 0.0005;

export function generateThumbnailUrl(
  encodedPolyline: string,
  apiKey: string,
): string | null {
  if (!encodedPolyline) return null;

  const points = decodePolyline(encodedPolyline);
  if (points.length === 0) return null;

  const simplified = simplifyPolyline(points, DEFAULT_TOLERANCE);
  const url = buildUrl(encodePolyline(simplified), apiKey);

  if (url.length <= MAX_URL_LENGTH) return url;

  const moreSimplified = simplifyPolyline(points, FALLBACK_TOLERANCE);
  const fallbackUrl = buildUrl(encodePolyline(moreSimplified), apiKey);

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

function buildUrl(encodedPath: string, apiKey: string): string {
  return (
    "https://maps.googleapis.com/maps/api/staticmap?" +
    "size=400x200" +
    "&maptype=roadmap" +
    `&path=color:0x4F46E5FF|weight:3|enc:${encodedPath}` +
    `&key=${apiKey}`
  );
}
