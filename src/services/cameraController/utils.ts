/**
 * CameraController モード共通ユーティリティ。
 * 純粋な計算関数のみ。Google Maps API を呼ばない。
 */

// --- Auto-zoom constants (D-023) ---
const LOOKAHEAD_SECONDS = 15;
const MIN_LOOKAHEAD_M = 50;
const TURN_APPROACH_START_M = 300;
const TURN_APPROACH_FULL_M = 100;
const TURN_MAX_BOOST = 2;
const ZOOM_CAP = 18;

/** ピボットズームの新 center を計算 */
export function calcPivotCenter(
  curCenter: { lat: number; lng: number },
  marker: { lat: number; lng: number },
  curZoom: number,
  newZoom: number,
): { lat: number; lng: number } {
  const scale = Math.pow(2, curZoom - newZoom);
  return {
    lat: marker.lat + (curCenter.lat - marker.lat) * scale,
    lng: marker.lng + (curCenter.lng - marker.lng) * scale,
  };
}

/**
 * autoZoom のターゲットズームレベルを計算（D-023）。
 * rate-limit 前の raw target を返す。
 */
export function calcAutoZoomTarget(
  speed: number,
  distanceToNextStepM: number,
  lat: number,
  screenHalfH: number,
): number {
  // Baseline: time-lookahead model
  const lookaheadM = Math.max(speed * LOOKAHEAD_SECONDS, MIN_LOOKAHEAD_M);
  const baseline = Math.log2(
    (156543.03392 * Math.cos(lat * Math.PI / 180) * screenHalfH) / lookaheadM,
  );

  // Turn approach boost
  let turnBoost = 0;
  if (distanceToNextStepM > 0 && distanceToNextStepM <= TURN_APPROACH_START_M) {
    if (distanceToNextStepM <= TURN_APPROACH_FULL_M) {
      turnBoost = TURN_MAX_BOOST;
    } else {
      turnBoost =
        ((TURN_APPROACH_START_M - distanceToNextStepM) /
          (TURN_APPROACH_START_M - TURN_APPROACH_FULL_M)) *
        TURN_MAX_BOOST;
    }
  }

  return Math.min(baseline + turnBoost, ZOOM_CAP);
}

/** ズームレベルに応じたステップ補正係数 */
export function zoomStepFactor(currentZoom: number, direction: 1 | -1): number {
  if (direction > 0) {
    if (currentZoom >= 18) return 0.3;
    if (currentZoom >= 15) return 0.5;
    if (currentZoom >= 10) return 0.8;
    return 1.0;
  } else {
    if (currentZoom <= 5) return 0.5;
    if (currentZoom <= 8) return 0.8;
    return 1.0;
  }
}

/** 加速テーブル（長押しズーム用） */
export const ACCEL_PHASES: readonly { until: number; baseStep: number }[] = [
  { until: 5, baseStep: 0.25 },
  { until: 15, baseStep: 0.4 },
  { until: Infinity, baseStep: 0.5 },
] as const;
