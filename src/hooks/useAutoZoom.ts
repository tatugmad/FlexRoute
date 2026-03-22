import { useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import { useMap } from "@vis.gl/react-google-maps";

const LOOKAHEAD_SECONDS = 15;
const MIN_LOOKAHEAD_M = 50;
const MAX_ZOOM_DELTA = 0.5;
const MIN_UPDATE_INTERVAL_MS = 4500;
const TURN_APPROACH_START_M = 300;
const TURN_APPROACH_FULL_M = 100;
const TURN_MAX_BOOST = 2;
const ZOOM_CAP = 18;

/**
 * 時間先読みモデル + ターン接近ズーム (D-023)
 *
 * - ベースライン: 現在速度×15秒の距離が画面半分に収まるズーム
 * - ターン接近: 300m→100m で線形に最大+2レベル
 * - ズーム変化は ±0.5/回、4.5秒間隔制限（OsmAnd準拠）
 */
export function useAutoZoom(): number | null {
  const map = useMap();
  const zoomMode = useNavigationStore((s) => s.zoomMode);
  const speed = useNavigationStore((s) => s.speed);
  const currentPosition = useNavigationStore((s) => s.currentPosition);
  const distanceToNextStepM = useNavigationStore((s) => s.distanceToNextStepM);

  const prevZoomRef = useRef<number | null>(null);
  const prevTimeRef = useRef(0);

  if (zoomMode !== "autoZoom") return null;
  if (!map || !currentPosition) return prevZoomRef.current;

  const now = Date.now();
  if (prevTimeRef.current && now - prevTimeRef.current < MIN_UPDATE_INTERVAL_MS) {
    return prevZoomRef.current;
  }

  // --- Baseline: time-lookahead model ---
  const speedMs = speed ?? 0;
  const lookaheadM = Math.max(speedMs * LOOKAHEAD_SECONDS, MIN_LOOKAHEAD_M);
  const lat = currentPosition.lat;
  const mapDiv = (map as google.maps.Map).getDiv();
  const screenHalfH = mapDiv ? mapDiv.offsetHeight / 2 : 300;
  const baseline = Math.log2(
    (156543.03392 * Math.cos(lat * Math.PI / 180) * screenHalfH) / lookaheadM,
  );

  // --- Turn approach boost ---
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
    fr.debug(C.NAV, "zoom.turnApproach", {
      distM: Math.round(distanceToNextStepM),
      boost: Math.round(turnBoost * 100) / 100,
    });
  }

  let target = Math.min(baseline + turnBoost, ZOOM_CAP);

  // --- Rate-limit: ±0.5 per update ---
  if (prevZoomRef.current !== null) {
    const delta = target - prevZoomRef.current;
    if (Math.abs(delta) > MAX_ZOOM_DELTA) {
      target = prevZoomRef.current + Math.sign(delta) * MAX_ZOOM_DELTA;
    }
  }

  // Round to 1 decimal
  target = Math.round(target * 10) / 10;

  prevZoomRef.current = target;
  prevTimeRef.current = now;

  const speedKmh = Math.round(speedMs * 3.6);
  fr.trace(C.NAV, "zoom.auto", {
    baseline: Math.round(baseline * 10) / 10,
    turnBoost: Math.round(turnBoost * 100) / 100,
    target,
    speedKmh,
  });

  return target;
}
