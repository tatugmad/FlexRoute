import { useEffect, useMemo, useRef } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { closestPointOnSegment } from "@/utils/geometry";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { LatLng, SavedRouteLeg } from "@/types";

type SegmentInfo = {
  legIndex: number;
  stepIndex: number;
  globalStepIndex: number;
  a: google.maps.LatLng;
  b: google.maps.LatLng;
};

type StepMeta = {
  legIndex: number;
  stepIndex: number;
  globalStepIndex: number;
  endpoint: google.maps.LatLng;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
};

function buildSegmentsAndMeta(legs: SavedRouteLeg[]) {
  const segments: SegmentInfo[] = [];
  const stepMetas: StepMeta[] = [];
  let globalStepIndex = 0;

  for (let li = 0; li < legs.length; li++) {
    const leg = legs[li]!;
    for (let si = 0; si < leg.steps.length; si++) {
      const step = leg.steps[si]!;
      const decoded = google.maps.geometry.encoding.decodePath(step.encodedPolyline);
      for (let i = 0; i < decoded.length - 1; i++) {
        segments.push({ legIndex: li, stepIndex: si, globalStepIndex, a: decoded[i]!, b: decoded[i + 1]! });
      }
      const endpoint = decoded.length > 0 ? decoded[decoded.length - 1]! : null;
      if (endpoint) {
        stepMetas.push({
          legIndex: li, stepIndex: si, globalStepIndex,
          endpoint, instruction: step.instruction,
          distanceMeters: step.distanceMeters, durationSeconds: step.durationSeconds,
        });
      }
      globalStepIndex++;
    }
  }
  return { segments, stepMetas };
}

export function useStepProgression(legs: SavedRouteLeg[], position: LatLng | null) {
  const advanceStep = useNavigationStore((s) => s.advanceStep);
  const setNextInstruction = useNavigationStore((s) => s.setNextInstruction);
  const setRemaining = useNavigationStore((s) => s.setRemaining);
  const prevGlobalRef = useRef(0);

  const { segments, stepMetas } = useMemo(() => {
    if (legs.length === 0 || typeof google === "undefined" || !google.maps?.geometry) {
      return { segments: [] as SegmentInfo[], stepMetas: [] as StepMeta[] };
    }
    return buildSegmentsAndMeta(legs);
  }, [legs]);

  const totalDistance = useMemo(
    () => stepMetas.reduce((sum, m) => sum + m.distanceMeters, 0), [stepMetas],
  );
  const totalDuration = useMemo(
    () => stepMetas.reduce((sum, m) => sum + m.durationSeconds, 0), [stepMetas],
  );

  useEffect(() => {
    if (!position || segments.length === 0 || stepMetas.length === 0) return;
    if (typeof google === "undefined" || !google.maps?.geometry) return;

    const p = new google.maps.LatLng(position.lat, position.lng);
    let bestDist = Infinity;
    let bestGlobal = prevGlobalRef.current;

    for (const seg of segments) {
      const { dist } = closestPointOnSegment(p, seg.a, seg.b);
      if (dist < bestDist) {
        bestDist = dist;
        bestGlobal = seg.globalStepIndex;
      }
    }

    // Monotonic: never go backward
    if (bestGlobal < prevGlobalRef.current) {
      bestGlobal = prevGlobalRef.current;
    }

    // Advance through skipped steps
    while (prevGlobalRef.current < bestGlobal) {
      const meta = stepMetas.find((m) => m.globalStepIndex === prevGlobalRef.current);
      if (meta) {
        advanceStep({
          legIndex: meta.legIndex,
          stepIndex: meta.stepIndex,
          exitTimestamp: new Date().toISOString(),
          exitPosition: position,
        });
        fr.debug(C.NAV, "step.advance", {
          legIndex: meta.legIndex, stepIndex: meta.stepIndex,
          globalStepIndex: meta.globalStepIndex,
        });
      }
      prevGlobalRef.current++;
    }

    // Distance to current step endpoint
    const currentMeta = stepMetas.find((m) => m.globalStepIndex === bestGlobal);
    let distToStepEnd = 0;
    if (currentMeta) {
      distToStepEnd = google.maps.geometry.spherical.computeDistanceBetween(
        p, currentMeta.endpoint,
      );
    }

    // Next instruction
    const nextMeta = stepMetas.find((m) => m.globalStepIndex === bestGlobal + 1);
    setNextInstruction(nextMeta?.instruction ?? null, distToStepEnd);
    fr.trace(C.NAV, "step.distance", { distM: Math.round(distToStepEnd), stepIndex: bestGlobal });

    // Remaining distance/duration
    const passedDistance = stepMetas
      .filter((m) => m.globalStepIndex < bestGlobal)
      .reduce((sum, m) => sum + m.distanceMeters, 0);
    const currentStepDist = currentMeta?.distanceMeters ?? 0;
    const currentStepProgress = currentStepDist > 0
      ? Math.max(0, 1 - distToStepEnd / currentStepDist)
      : 0;
    const passedCurrent = currentStepDist * currentStepProgress;
    const remainDist = Math.max(0, totalDistance - passedDistance - passedCurrent);
    const remainDur = totalDistance > 0
      ? (remainDist / totalDistance) * totalDuration
      : 0;
    setRemaining(remainDist, remainDur);
  }, [position, segments, stepMetas, totalDistance, totalDuration, advanceStep, setNextInstruction, setRemaining]);
}
