import { useNavigationStore } from "@/stores/navigationStore";

export function AccuracyOverlay() {
  const accuracy = useNavigationStore((s) => s.accuracy);
  const quality = useNavigationStore((s) => s.positionQuality);

  return (
    <div className="absolute bottom-4 right-4 z-40 bg-slate-900/60 text-white text-xs font-mono px-3 py-1.5 rounded-lg pointer-events-none select-none">
      <div>accuracy: {accuracy !== null ? `${Math.round(accuracy)}m` : "—"}</div>
      <div>quality: {quality}</div>
    </div>
  );
}
