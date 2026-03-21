/**
 * 0°/360° 境界を越える時に最短回転方向のデルタを返す。
 * 戻り値は -180 〜 +180 の範囲。
 *
 * 例: shortestDelta(350, 10) → +20（北回り）
 *     shortestDelta(10, 350) → -20（北回り）
 */
export function shortestDelta(from: number, to: number): number {
  return ((to - from) % 360 + 540) % 360 - 180;
}
