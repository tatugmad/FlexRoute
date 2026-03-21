/**
 * FlightRecorder のデバッグツール — window.__fr + verify (D-033)
 */
import { LOG_LEVELS, LOG_CATEGORIES } from "@/types/log";
import type {
  LogLevelName,
  LogCategoryName,
  FormattedLogEntry,
  VerifyResult,
} from "@/types/log";
import { BUFFER_SIZE, toLevelName, toCategoryName } from "./logFormatters";
import { flightRecorder } from "./flightRecorder";

function verify(): VerifyResult {
  const entries = flightRecorder.getAllEntries();
  const startWall = flightRecorder.getStartWall();

  const levelCounts = {} as Record<LogLevelName, number>;
  for (const name of Object.keys(LOG_LEVELS) as LogLevelName[]) {
    levelCounts[name] = 0;
  }
  const categoryCounts: Record<string, number> = {};
  for (const name of Object.keys(LOG_CATEGORIES)) {
    categoryCounts[name] = 0;
  }

  const now = performance.now();
  let oldestT: number | null = null;

  for (const e of entries) {
    const ln = toLevelName(e.level);
    levelCounts[ln] = (levelCounts[ln] ?? 0) + 1;
    const cn = toCategoryName(e.cat);
    categoryCounts[cn] = (categoryCounts[cn] ?? 0) + 1;
    if (oldestT === null || e.t < oldestT) oldestT = e.t;
  }

  const duplicates: string[] = [];
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1]!;
    const cur = entries[i]!;
    if (prev.tag === cur.tag && prev.level === cur.level) {
      const key = `${toLevelName(cur.level)}:${cur.tag}`;
      if (!duplicates.includes(key)) duplicates.push(key);
    }
  }

  const missingCategories = (
    Object.keys(LOG_CATEGORIES) as LogCategoryName[]
  ).filter((name) => categoryCounts[name] === 0);

  const lastEntries = flightRecorder
    .getRecent(5)
    .reverse()
    .map((e) => {
      const entry: FormattedLogEntry = {
        timestamp: new Date(startWall + e.t).toISOString(),
        level: toLevelName(e.level),
        category: toCategoryName(e.cat),
        tag: e.tag,
      };
      if (e.data !== undefined) entry.data = e.data;
      return entry;
    });

  return {
    bufferSize: BUFFER_SIZE,
    entryCount: flightRecorder.getEntryCount(),
    oldestAgeMs: oldestT !== null ? Math.round(now - oldestT) : null,
    levelCounts,
    categoryCounts,
    lastEntries,
    duplicates,
    missingCategories,
  };
}

export function installDevTools(): void {
  (window as unknown as Record<string, unknown>).__fr = {
    verify: () => {
      const result = verify();
      console.log("=== FlightRecorder Verify ===");
      console.log(
        `Buffer: ${result.entryCount} / ${result.bufferSize} entries`,
      );
      if (result.oldestAgeMs !== null) {
        console.log(
          `Oldest entry: ${(result.oldestAgeMs / 1000).toFixed(1)}s ago`,
        );
      }
      console.log("Level counts:");
      console.table(result.levelCounts);
      console.log("Category counts:");
      console.table(result.categoryCounts);
      if (result.duplicates.length > 0) {
        console.warn("Consecutive duplicates:", result.duplicates);
      }
      if (result.missingCategories.length > 0) {
        console.log("Missing categories:", result.missingCategories);
      }
      console.log("Last 5 entries:");
      console.table(result.lastEntries);
      return result;
    },
    dump: () => flightRecorder.dump(),
    clear: () => flightRecorder.clear(),
    level: (name: string) => {
      const lvl = LOG_LEVELS[name as LogLevelName];
      if (lvl !== undefined) {
        flightRecorder.setConsoleLevel(lvl);
      }
    },
  };
}
