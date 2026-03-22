const OFF_ROUTE_ENTER_M = 50;
const OFF_ROUTE_EXIT_M = 30;

/** Hysteresis check: enter at 50m, exit at 30m to prevent flicker */
export function checkOffRoute(wasOffRoute: boolean, distM: number): boolean {
  if (!wasOffRoute && distM > OFF_ROUTE_ENTER_M) return true;
  if (wasOffRoute && distM < OFF_ROUTE_EXIT_M) return false;
  return wasOffRoute;
}
