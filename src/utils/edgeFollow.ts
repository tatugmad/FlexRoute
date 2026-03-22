const EDGE_MARGIN_PX = 60;

/**
 * D-036: free モードのエッジ追従。
 * マーカーが画面端からマージン以内に接近したら、
 * 進行方向の前方に視野を確保した center を返す。
 * スクロール不要なら null を返す。
 */
export function computeEdgeFollow(
  map: google.maps.Map,
  markerPos: { lat: number; lng: number },
  headingDeg: number,
): { lat: number; lng: number } | null {
  const bounds = map.getBounds();
  if (!bounds) return null;

  const mapDiv = map.getDiv();
  const mapWidth = mapDiv.offsetWidth;
  const mapHeight = mapDiv.offsetHeight;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const latRange = ne.lat() - sw.lat();
  const lngRange = ne.lng() - sw.lng();

  // マージンを緯度経度に換算（画面サイズに対する比率）
  const marginLat = latRange * (EDGE_MARGIN_PX / mapHeight);
  const marginLng = lngRange * (EDGE_MARGIN_PX / mapWidth);

  // 内側マージン境界
  const innerNorth = ne.lat() - marginLat;
  const innerSouth = sw.lat() + marginLat;
  const innerEast = ne.lng() - marginLng;
  const innerWest = sw.lng() + marginLng;

  const isInside =
    markerPos.lat < innerNorth &&
    markerPos.lat > innerSouth &&
    markerPos.lng < innerEast &&
    markerPos.lng > innerWest;

  if (isInside) return null;

  // 進行方向の反対側にオフセット（画面の 1/4 分）して前方視野を確保
  const rad = headingDeg * (Math.PI / 180);
  const offsetLat = latRange * 0.25 * Math.cos(rad);
  const offsetLng = lngRange * 0.25 * Math.sin(rad);

  return {
    lat: markerPos.lat - offsetLat,
    lng: markerPos.lng - offsetLng,
  };
}
