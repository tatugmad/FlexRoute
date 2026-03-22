import { useMemo, useState, useCallback } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useRouteStore } from "@/stores/routeStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSensorStore } from "@/stores/sensorStore";

type StepEndpoint = {
  lat: number;
  lng: number;
  globalIndex: number;
  legIndex: number;
  stepIndex: number;
  instruction: string;
  roadType: string;
  distanceMeters: number;
  durationSeconds: number;
};

export function StepDebugMarkers() {
  const debugEnabled = useSensorStore((s) => s.debugEnabled);
  if (!debugEnabled) return null;
  return <StepDebugMarkersInner />;
}

function StepDebugMarkersInner() {
  const currentLegs = useRouteStore((s) => s.currentLegs);
  const currentStepIndex = useNavigationStore((s) => s.currentStepIndex);
  const stepPassages = useNavigationStore((s) => s.stepPassages);
  const [selected, setSelected] = useState<number | null>(null);

  const endpoints = useMemo(() => {
    if (typeof google === "undefined" || !google.maps?.geometry) return [];
    const result: StepEndpoint[] = [];
    let globalIndex = 0;
    for (let li = 0; li < currentLegs.length; li++) {
      const leg = currentLegs[li]!;
      for (let si = 0; si < leg.steps.length; si++) {
        const step = leg.steps[si]!;
        const decoded = google.maps.geometry.encoding.decodePath(step.encodedPolyline);
        const last = decoded[decoded.length - 1];
        if (last) {
          result.push({
            lat: last.lat(), lng: last.lng(), globalIndex,
            legIndex: li, stepIndex: si, instruction: step.instruction,
            roadType: step.roadType, distanceMeters: step.distanceMeters,
            durationSeconds: step.durationSeconds,
          });
        }
        globalIndex++;
      }
    }
    return result;
  }, [currentLegs]);

  const getColor = useCallback((globalIndex: number) => {
    if (globalIndex < currentStepIndex) return "#22c55e";
    if (globalIndex === currentStepIndex) return "#3b82f6";
    return "#9ca3af";
  }, [currentStepIndex]);

  const handleClick = useCallback((globalIndex: number) => {
    setSelected((prev) => (prev === globalIndex ? null : globalIndex));
  }, []);

  return (
    <>
      {endpoints.map((ep) => (
        <AdvancedMarker
          key={ep.globalIndex}
          position={{ lat: ep.lat, lng: ep.lng }}
          zIndex={50}
          onClick={() => handleClick(ep.globalIndex)}
        >
          <div
            className="w-3 h-3 rounded-full border border-white"
            style={{ backgroundColor: getColor(ep.globalIndex) }}
          />
        </AdvancedMarker>
      ))}
      {selected !== null && <StepPopover endpoint={endpoints.find((e) => e.globalIndex === selected)!} passages={stepPassages} onClose={() => setSelected(null)} />}
    </>
  );
}

function StepPopover({ endpoint: ep, passages, onClose }: {
  endpoint: StepEndpoint;
  passages: { legIndex: number; stepIndex: number; exitTimestamp: string }[];
  onClose: () => void;
}) {
  const isOffRoute = useNavigationStore((s) => s.isOffRoute);
  const offRouteDistance = useNavigationStore((s) => s.offRouteDistance);
  if (!ep) return null;
  const passage = passages.find((p) => p.legIndex === ep.legIndex && p.stepIndex === ep.stepIndex);
  return (
    <AdvancedMarker position={{ lat: ep.lat, lng: ep.lng }} zIndex={200}>
      <div className="bg-white rounded-lg shadow-lg p-2 text-xs max-w-[200px]" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold mb-1">Leg {ep.legIndex} / Step {ep.stepIndex}</div>
        <div className="truncate">{ep.instruction || "(no instruction)"}</div>
        <div>road: {ep.roadType}</div>
        <div>{ep.distanceMeters}m / {ep.durationSeconds}s</div>
        {passage && <div className="text-green-600 mt-1">passed: {passage.exitTimestamp}</div>}
        <div className="mt-1">Off-route: {offRouteDistance}m ({isOffRoute ? "YES" : "no"})</div>
        <button className="text-blue-500 mt-1 underline" onClick={onClose}>close</button>
      </div>
    </AdvancedMarker>
  );
}
