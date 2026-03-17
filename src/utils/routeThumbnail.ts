import {
  generateThumbnailUrl,
  generateMarkerThumbnailUrl,
  generateMapThumbnailUrl,
  adjustZoomForThumbnail,
} from "@/utils/thumbnailUrl";
import {
  CARD_WIDTH, CARD_THUMBNAIL_HEIGHT,
  CARD_WIDTH_SM, CARD_THUMBNAIL_HEIGHT_SM,
} from "@/constants/cardLayout";

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

/** スモール版サムネイルURLを生成する */
export function generateRouteThumbnailUrlSmall(
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
  // ポリラインURL: APIがサイズに応じてzoomを自動調整するため、size置換のみ
  const polyUrl = generateThumbnailUrl(saved.encodedPolyline, apiKey);
  if (polyUrl) {
    return polyUrl.replace(
      `size=${CARD_WIDTH}x${CARD_THUMBNAIL_HEIGHT}`,
      `size=${CARD_WIDTH_SM}x${CARD_THUMBNAIL_HEIGHT_SM}`,
    );
  }
  // マーカー / 地図のみ: 小サイズ用にzoomを再計算してURLを直接構築
  const zoom = saved.mapZoom != null
    ? adjustZoomForThumbnail(saved.mapZoom, saved.mapWidth, saved.mapHeight, CARD_WIDTH_SM, CARD_THUMBNAIL_HEIGHT_SM)
    : null;
  if (saved.waypoints.length > 0 && zoom != null) {
    return buildSmallMarkerUrl(saved.waypoints, zoom, apiKey);
  }
  if (saved.mapCenter && zoom != null) {
    return buildSmallMapUrl(saved.mapCenter, zoom, apiKey);
  }
  return null;
}

/** スモールマーカーURL構築 */
function buildSmallMarkerUrl(
  waypoints: Array<{ position: { lat: number; lng: number } }>,
  zoom: number,
  apiKey: string,
): string {
  let url =
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `size=${CARD_WIDTH_SM}x${CARD_THUMBNAIL_HEIGHT_SM}&scale=2&maptype=roadmap`;
  if (waypoints.length === 1) {
    const wp = waypoints[0]!;
    url += `&center=${wp.position.lat},${wp.position.lng}&zoom=${zoom}`;
    url += `&markers=color:red|${wp.position.lat},${wp.position.lng}`;
  } else {
    const first = waypoints[0]!;
    const last = waypoints[waypoints.length - 1]!;
    url += `&markers=color:green|label:S|${first.position.lat},${first.position.lng}`;
    url += `&markers=color:red|label:G|${last.position.lat},${last.position.lng}`;
  }
  return url + `&key=${apiKey}`;
}

/** スモール地図URL構築 */
function buildSmallMapUrl(
  center: { lat: number; lng: number },
  zoom: number,
  apiKey: string,
): string {
  return (
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `size=${CARD_WIDTH_SM}x${CARD_THUMBNAIL_HEIGHT_SM}&scale=2&maptype=roadmap` +
    `&center=${center.lat},${center.lng}&zoom=${zoom}` +
    `&key=${apiKey}`
  );
}
