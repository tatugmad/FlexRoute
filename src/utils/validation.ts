/** 座標が有効か検証する（NaN, Infinity, (0,0) を拒否） */
export function isValidPosition(pos: { lat: number; lng: number }): boolean {
  return Number.isFinite(pos.lat) && Number.isFinite(pos.lng) && !(pos.lat === 0 && pos.lng === 0);
}
