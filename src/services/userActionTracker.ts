import type { UserAction } from "@/types";
import { logService } from "./logService";

const MAX_ACTIONS = 200;

class UserActionTrackerImpl {
  private buffer: UserAction[] = [];

  track(action: string, detail?: unknown): void {
    const entry: UserAction = {
      timestamp: new Date().toISOString(),
      action,
      detail,
    };

    if (this.buffer.length >= MAX_ACTIONS) {
      this.buffer.shift();
    }
    this.buffer.push(entry);

    logService.info("USER_ACTION", action, detail);
  }

  getRecentActions(count = 50): UserAction[] {
    return this.buffer.slice(-count);
  }

  exportActions(): string {
    return JSON.stringify(this.buffer, null, 2);
  }
}

export const userActionTracker = new UserActionTrackerImpl();
