/**
 * ログのレベル・カテゴリ逆引き + コンソール出力ヘルパー (D-033)
 */
import { LOG_LEVELS, LOG_CATEGORIES } from "@/types/log";
import type { LogLevelName, LogCategoryName } from "@/types/log";

export const BUFFER_SIZE = 10000;

const levelEntries = Object.entries(LOG_LEVELS) as [LogLevelName, number][];
const categoryEntries = Object.entries(LOG_CATEGORIES) as [
  LogCategoryName,
  number,
][];

export function toLevelName(n: number): LogLevelName {
  for (const [name, val] of levelEntries) {
    if (val === n) return name;
  }
  return "error";
}

export function toCategoryName(n: number): LogCategoryName {
  for (const [name, val] of categoryEntries) {
    if (val === n) return name;
  }
  return "ERROR";
}

export const consoleFns: Record<number, (...args: unknown[]) => void> = {
  [LOG_LEVELS.trace]: console.trace,
  [LOG_LEVELS.debug]: console.debug,
  [LOG_LEVELS.info]: console.info,
  [LOG_LEVELS.warn]: console.warn,
  [LOG_LEVELS.error]: console.error,
};

export function formatWallClock(
  relativeMs: number,
  startWall: number,
): string {
  const d = new Date(startWall + relativeMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}
