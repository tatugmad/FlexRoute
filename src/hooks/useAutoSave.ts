import { useEffect, useRef } from "react";
import { useRouteStore } from "@/stores/routeStore";

const DEBOUNCE_MS = 2000;

export function useAutoSave() {
  const isDirty = useRouteStore((s) => s.isDirty);
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const saveCurrentRoute = useRouteStore((s) => s.saveCurrentRoute);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty || !currentRoute) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveCurrentRoute();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, currentRoute, saveCurrentRoute]);
}
