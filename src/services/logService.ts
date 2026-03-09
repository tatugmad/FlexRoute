import type { LogEntry, LogLevel } from "@/types";

const MAX_ENTRIES = 500;
const IS_DEV = import.meta.env.DEV;
const IS_PROD = import.meta.env.PROD;

const CONSOLE_STYLES: Record<LogLevel, string> = {
  debug: "color: #9ca3af",
  info: "color: #3b82f6",
  warn: "color: #eab308",
  error: "color: #ef4444",
};

class RingBuffer<T> {
  private buffer: T[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }

  getRecent(count: number): T[] {
    return this.buffer.slice(-count);
  }

  getAll(): T[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }
}

class LogServiceImpl {
  private entries = new RingBuffer<LogEntry>(MAX_ENTRIES);

  debug(category: string, message: string, data?: unknown): void {
    if (IS_PROD) return;
    this.log("debug", category, message, data);
  }

  info(category: string, message: string, data?: unknown): void {
    if (IS_PROD) return;
    this.log("info", category, message, data);
  }

  warn(category: string, message: string, data?: unknown): void {
    this.log("warn", category, message, data);
  }

  error(category: string, message: string, data?: unknown): void {
    this.log("error", category, message, data);
  }

  getRecentLogs(count = 50): LogEntry[] {
    return this.entries.getRecent(count);
  }

  exportLogs(): string {
    return JSON.stringify(this.entries.getAll(), null, 2);
  }

  clear(): void {
    this.entries.clear();
  }

  /** フェーズ2: 外部ログサービスへの送信スタブ */
  send(_entries: LogEntry[]): void {
    // Sentry等への送信をここに実装
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    this.entries.push(entry);

    if (IS_DEV) {
      const tag = `[${category}]`;
      const style = CONSOLE_STYLES[level];
      const consoleFn = console[level] ?? console.log;
      if (data !== undefined) {
        consoleFn(`%c${tag} ${message}`, style, data);
      } else {
        consoleFn(`%c${tag} ${message}`, style);
      }
    }
  }
}

export const logService = new LogServiceImpl();
