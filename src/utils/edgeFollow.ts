// getBounds() は heading 回転を考慮しない軸平行矩形を返すため、
// headingUp 時に実際の表示領域とずれる。大きめのマージンでカバーする。
// Phase 2 で projection + heading のピクセル座標変換による精密判定を検討。
const EDGE_MARGIN_PX = 120;

/**
 * D-036: free モードのエッジ追従。
 * マーカーが画面端からマージン以内に接近したら、
 * 現在の center から最小シフトした center を返す。
 * スクロール不要なら null を返す。
 */
export function computeEdgeFollow(
  map: google.maps.Map,
  markerPos: { lat: number; lng: number },
): { lat: number; lng: number } | null {
  const bounds = map.getBounds();
  const center = map.getCenter();
  if (!bounds || !center) return null;

  const mapDiv = map.getDiv();
  const mapWidth = mapDiv.offsetWidth;
  const mapHeight = mapDiv.offsetHeight;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const latRange = ne.lat() - sw.lat();
  const lngRange = ne.lng() - sw.lng();

  // マージンを緯度経度に換算
  const marginLat = latRange * (EDGE_MARGIN_PX / mapHeight);
  const marginLng = lngRange * (EDGE_MARGIN_PX / mapWidth);

  // 内側マージン境界
  const innerNorth = ne.lat() - marginLat;
  const innerSouth = sw.lat() + marginLat;
  const innerEast = ne.lng() - marginLng;
  const innerWest = sw.lng() + marginLng;

  // マーカーが内側にあればスクロール不要
  if (
    markerPos.lat < innerNorth &&
    markerPos.lat > innerSouth &&
    markerPos.lng < innerEast &&
    markerPos.lng > innerWest
  ) {
    return null;
  }

  // 現在の center から最小シフトを計算
  let shiftLat = 0;
  let shiftLng = 0;

  // 北にはみ出し
  if (markerPos.lat >= innerNorth) {
    shiftLat = markerPos.lat - innerNorth;
  }
  // 南にはみ出し
  if (markerPos.lat <= innerSouth) {
    shiftLat = markerPos.lat - innerSouth;
  }
  // 東にはみ出し
  if (markerPos.lng >= innerEast) {
    shiftLng = markerPos.lng - innerEast;
  }
  // 西にはみ出し
  if (markerPos.lng <= innerWest) {
    shiftLng = markerPos.lng - innerWest;
  }

  if (shiftLat === 0 && shiftLng === 0) return null;

  return {
    lat: center.lat() + shiftLat,
    lng: center.lng() + shiftLng,
  };
}
