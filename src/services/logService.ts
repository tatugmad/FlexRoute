import type { LogEntry, LogLevel } from "@/types";
import { LOG_CATEGORIES } from "@/types/log";
import { flightRecorder } from "./flightRecorder";

function categoryToNum(category: string): number {
  const cat = LOG_CATEGORIES[category as keyof typeof LOG_CATEGORIES];
  return cat !== undefined ? cat : LOG_CATEGORIES.ERROR;
}

class LogServiceImpl {
  debug(category: string, message: string, data?: unknown): void {
    flightRecorder.debug(categoryToNum(category), message, data);
  }

  info(category: string, message: string, data?: unknown): void {
    flightRecorder.info(categoryToNum(category), message, data);
  }

  warn(category: string, message: string, data?: unknown): void {
    flightRecorder.warn(categoryToNum(category), message, data);
  }

  error(category: string, message: string, data?: unknown): void {
    flightRecorder.error(categoryToNum(category), message, data);
  }

  getRecentLogs(count = 50): LogEntry[] {
    return flightRecorder.getRecent(count).map((e) => {
      const levelNames: LogLevel[] = ["debug", "info", "warn", "error"];
      const level: LogLevel = levelNames[e.level - 1] ?? "error";
      const catNames = Object.keys(LOG_CATEGORIES);
      const catVals = Object.values(LOG_CATEGORIES);
      const catIdx = (catVals as readonly number[]).indexOf(e.cat);
      const category = (catIdx >= 0 ? catNames[catIdx] : "ERROR") ?? "ERROR";
      return {
        timestamp: new Date(
          Date.now() - (performance.now() - e.t),
        ).toISOString(),
        level,
        category,
        message: e.tag,
        data: e.data,
      };
    });
  }

  exportLogs(): string {
    return JSON.stringify(flightRecorder.dump(), null, 2);
  }

  clear(): void {
    flightRecorder.clear();
  }

  /** フェーズ2: 外部ログサービスへの送信スタブ */
  send(_entries: LogEntry[]): void {
    // Sentry等への送信をここに実装
  }
}

export const logService = new LogServiceImpl();
