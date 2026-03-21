/**
 * FlightRecorder — 統合ログバッファ (D-033)
 *
 * 全ログを構造化データとして CircularBuffer に記録する。
 * コンソール出力は consoleLevel 以上のみ。
 */
import { LOG_LEVELS } from "@/types/log";
import type {
  FlightRecorderEntry,
  FormattedLogEntry,
} from "@/types/log";
import {
  BUFFER_SIZE,
  toLevelName,
  toCategoryName,
  consoleFns,
  formatWallClock,
} from "./logFormatters";

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
      const idx = (this.head - 1 - i + BUFFER_SIZE * 2) % BUFFER_SIZE;
      result.push(this.buffer[idx]!);
    }
    return result;
  }

  /** 古い順に全エントリを返す（verify 用） */
  getAllEntries(): FlightRecorderEntry[] {
    const result: FlightRecorderEntry[] = [];
    const start = this.count < BUFFER_SIZE ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % BUFFER_SIZE;
      const e = this.buffer[idx];
      if (e) result.push(e);
    }
    return result;
  }

  getEntryCount(): number {
    return this.count;
  }

  getStartWall(): number {
    return this.startWall;
  }

  clear(): void {
    this.buffer = new Array(BUFFER_SIZE);
    this.head = 0;
    this.count = 0;
  }
}

export const flightRecorder = new FlightRecorderImpl();
