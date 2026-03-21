/**
 * FlightRecorder — 統合ログバッファ (D-033)
 *
 * 全ログを構造化データとして CircularBuffer に記録する。
 * コンソール出力は consoleLevel 以上のみ。
 */
import { LOG_LEVELS, LOG_CATEGORIES } from "@/types/log";
import type {
  LogLevelName,
  LogCategoryName,
  FlightRecorderEntry,
  FormattedLogEntry,
  VerifyResult,
} from "@/types/log";

const BUFFER_SIZE = 10000;

// ── レベル・カテゴリの逆引きテーブル ──

const levelNames = Object.entries(LOG_LEVELS) as [LogLevelName, number][];
const categoryNames = Object.entries(LOG_CATEGORIES) as [
  LogCategoryName,
  number,
][];

function toLevelName(n: number): LogLevelName {
  for (const [name, val] of levelNames) {
    if (val === n) return name;
  }
  return "error";
}

function toCategoryName(n: number): LogCategoryName {
  for (const [name, val] of categoryNames) {
    if (val === n) return name;
  }
  return "ERROR";
}

// ── コンソール出力用ヘルパー ──

const consoleFns: Record<number, (...args: unknown[]) => void> = {
  [LOG_LEVELS.trace]: console.trace,
  [LOG_LEVELS.debug]: console.debug,
  [LOG_LEVELS.info]: console.info,
  [LOG_LEVELS.warn]: console.warn,
  [LOG_LEVELS.error]: console.error,
};

function formatWallClock(relativeMs: number, startWall: number): string {
  const d = new Date(startWall + relativeMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

// ── FlightRecorder 本体 ──

class FlightRecorderImpl {
  private buffer: (FlightRecorderEntry | undefined)[];
  private head = 0;
  private count = 0;
  private consoleLevel: number = LOG_LEVELS.warn;
  private startTime: number;
  private startWall: number;

  constructor() {
    this.buffer = new Array(BUFFER_SIZE);
    this.startTime = performance.now();
    this.startWall = Date.now() - this.startTime;
  }

  record(level: number, cat: number, tag: string, data?: unknown): void {
    const t = performance.now();

    const entry: FlightRecorderEntry = { t, level, cat, tag };
    if (data !== undefined) entry.data = data;

    this.buffer[this.head] = entry;
    this.head = (this.head + 1) % BUFFER_SIZE;
    if (this.count < BUFFER_SIZE) this.count++;

    if (level >= this.consoleLevel) {
      const timeStr = formatWallClock(t, this.startWall);
      const lvl = toLevelName(level).toUpperCase();
      const catStr = toCategoryName(cat);
      const fn = consoleFns[level] ?? console.log;
      if (data !== undefined) {
        fn(`[${timeStr}] [${lvl}] [${catStr}] ${tag}`, data);
      } else {
        fn(`[${timeStr}] [${lvl}] [${catStr}] ${tag}`);
      }
    }
  }

  trace(cat: number, tag: string, data?: unknown): void {
    this.record(LOG_LEVELS.trace, cat, tag, data);
  }
  debug(cat: number, tag: string, data?: unknown): void {
    this.record(LOG_LEVELS.debug, cat, tag, data);
  }
  info(cat: number, tag: string, data?: unknown): void {
    this.record(LOG_LEVELS.info, cat, tag, data);
  }
  warn(cat: number, tag: string, data?: unknown): void {
    this.record(LOG_LEVELS.warn, cat, tag, data);
  }
  error(cat: number, tag: string, data?: unknown): void {
    this.record(LOG_LEVELS.error, cat, tag, data);
  }

  setConsoleLevel(level: number): void {
    this.consoleLevel = level;
  }

  dump(): FormattedLogEntry[] {
    const result: FormattedLogEntry[] = [];
    const start = this.count < BUFFER_SIZE ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % BUFFER_SIZE;
      const e = this.buffer[idx]!;
      const entry: FormattedLogEntry = {
        timestamp: new Date(this.startWall + e.t).toISOString(),
        level: toLevelName(e.level),
        category: toCategoryName(e.cat),
        tag: e.tag,
      };
      if (e.data !== undefined) entry.data = e.data;
      result.push(entry);
    }
    return result;
  }

  getRecent(n: number): FlightRecorderEntry[] {
    const take = Math.min(n, this.count);
    const result: FlightRecorderEntry[] = [];
    for (let i = 0; i < take; i++) {
      const idx =
        (this.head - 1 - i + BUFFER_SIZE * 2) % BUFFER_SIZE;
      result.push(this.buffer[idx]!);
    }
    return result;
  }

  verify(): VerifyResult {
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

    const start = this.count < BUFFER_SIZE ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % BUFFER_SIZE;
      const e = this.buffer[idx];
      if (!e) continue;
      const ln = toLevelName(e.level);
      levelCounts[ln] = (levelCounts[ln] ?? 0) + 1;
      const cn = toCategoryName(e.cat);
      categoryCounts[cn] = (categoryCounts[cn] ?? 0) + 1;
      if (oldestT === null || e.t < oldestT) oldestT = e.t;
    }

    // 重複検知: 連続する同一 tag+level
    const duplicates: string[] = [];
    for (let i = 1; i < this.count; i++) {
      const prevIdx = (start + i - 1) % BUFFER_SIZE;
      const curIdx = (start + i) % BUFFER_SIZE;
      const prev = this.buffer[prevIdx];
      const cur = this.buffer[curIdx];
      if (!prev || !cur) continue;
      if (prev.tag === cur.tag && prev.level === cur.level) {
        const key = `${toLevelName(cur.level)}:${cur.tag}`;
        if (!duplicates.includes(key)) duplicates.push(key);
      }
    }

    const missingCategories = (
      Object.keys(LOG_CATEGORIES) as LogCategoryName[]
    ).filter((name) => categoryCounts[name] === 0);

    const lastEntries = this.getRecent(5)
      .reverse()
      .map((e) => {
        const entry: FormattedLogEntry = {
          timestamp: new Date(this.startWall + e.t).toISOString(),
          level: toLevelName(e.level),
          category: toCategoryName(e.cat),
          tag: e.tag,
        };
        if (e.data !== undefined) entry.data = e.data;
        return entry;
      });

    return {
      bufferSize: BUFFER_SIZE,
      entryCount: this.count,
      oldestAgeMs: oldestT !== null ? Math.round(now - oldestT) : null,
      levelCounts,
      categoryCounts,
      lastEntries,
      duplicates,
      missingCategories,
    };
  }

  clear(): void {
    this.buffer = new Array(BUFFER_SIZE);
    this.head = 0;
    this.count = 0;
  }
}

const flightRecorder = new FlightRecorderImpl();

// ── window への公開（検証用） ──
(window as unknown as Record<string, unknown>).__fr = {
  verify: () => {
    const result = flightRecorder.verify();
    console.log("=== FlightRecorder Verify ===");
    console.log(
      `Buffer: ${result.entryCount} / ${result.bufferSize} entries`,
    );
    if (result.oldestAgeMs !== null) {
      console.log(`Oldest entry: ${(result.oldestAgeMs / 1000).toFixed(1)}s ago`);
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

export { flightRecorder };
