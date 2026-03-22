/**
 * 地図座標の幾何計算ユーティリティ
 * useRouteSnap / useStepProgression 等で共有する
 */

/** 線分 (a→b) 上の p への最近傍点と距離を返す */
export function closestPointOnSegment(
  p: google.maps.LatLng,
  a: google.maps.LatLng,
  b: google.maps.LatLng,
): { point: google.maps.LatLng; dist: number } {
  const { spherical } = google.maps.geometry;
  const headingAB = spherical.computeHeading(a, b);
  const headingAP = spherical.computeHeading(a, p);
  const distAB = spherical.computeDistanceBetween(a, b);
  const distAP = spherical.computeDistanceBetween(a, p);

  const angleDiff = (headingAP - headingAB + 360) % 360;
  const angleRad = (angleDiff > 180 ? angleDiff - 360 : angleDiff) * (Math.PI / 180);
  const projection = distAP * Math.cos(angleRad);

  if (projection <= 0) {
    return { point: a, dist: spherical.computeDistanceBetween(p, a) };
  }
  if (projection >= distAB) {
    return { point: b, dist: spherical.computeDistanceBetween(p, b) };
  }

  const snapped = spherical.computeOffset(a, projection, headingAB);
  return { point: snapped, dist: spherical.computeDistanceBetween(p, snapped) };
}
