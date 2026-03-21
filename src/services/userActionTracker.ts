import type { UserAction } from "@/types";
import { LOG_CATEGORIES } from "@/types/log";
import { flightRecorder } from "./flightRecorder";

class UserActionTrackerImpl {
  track(action: string, detail?: unknown): void {
    flightRecorder.info(LOG_CATEGORIES.USER_ACTION, action, detail);
  }

  getRecentActions(count = 50): UserAction[] {
    return flightRecorder
      .getRecent(count * 5) // 余裕を持って取得しフィルタ
      .filter((e) => e.cat === LOG_CATEGORIES.USER_ACTION)
      .slice(0, count)
      .map((e) => ({
        timestamp: new Date(
          Date.now() - (performance.now() - e.t),
        ).toISOString(),
        action: e.tag,
        detail: e.data,
      }));
  }

  exportActions(): string {
    return JSON.stringify(this.getRecentActions(200), null, 2);
  }
}

export const userActionTracker = new UserActionTrackerImpl();
