const EDGE_MARGIN_PX = 60;

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
    shiftLat = markerPos.lat - innerNorth + marginLat * 0.5;
  }
  // 南にはみ出し
  if (markerPos.lat <= innerSouth) {
    shiftLat = markerPos.lat - innerSouth - marginLat * 0.5;
  }
  // 東にはみ出し
  if (markerPos.lng >= innerEast) {
    shiftLng = markerPos.lng - innerEast + marginLng * 0.5;
  }
  // 西にはみ出し
  if (markerPos.lng <= innerWest) {
    shiftLng = markerPos.lng - innerWest - marginLng * 0.5;
  }

  if (shiftLat === 0 && shiftLng === 0) return null;

  return {
    lat: center.lat() + shiftLat,
    lng: center.lng() + shiftLng,
  };
}
