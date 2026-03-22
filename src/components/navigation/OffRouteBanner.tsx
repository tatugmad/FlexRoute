import { useNavigationStore } from "@/stores/navigationStore";

export function OffRouteBanner() {
  const isOffRoute = useNavigationStore((s) => s.isOffRoute);
  const offRouteDistance = useNavigationStore((s) => s.offRouteDistance);

  if (!isOffRoute) return null;

  return (
    <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-rose-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2">
        <span>ルートから逸脱しています</span>
        <span className="text-rose-200 text-xs font-mono">
          {offRouteDistance}m
        </span>
      </div>
    </div>
  );
}
