/** F-LOG v2 FlightRecorder 型定義 (D-033) */

/** ログレベル（数値が小さいほど詳細） */
export const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
} as const;

export type LogLevelName = keyof typeof LOG_LEVELS;

/** ログカテゴリ（数値は内部用。文字列変換は dump 時に行う） */
export const LOG_CATEGORIES = {
  NAV: 0,
  GPS: 1,
  SIM: 2,
  SNAP: 3,
  ROUTE: 4,
  STORAGE: 5,
  LABEL_STORE: 6,
  LABEL_STORAGE: 7,
  PLACE_STORE: 8,
  PLACE_STORAGE: 9,
  PLACE_DETAILS: 10,
  API: 11,
  UI: 12,
  PERF: 13,
  USER_ACTION: 14,
  ERROR: 15,
} as const;

export type LogCategoryName = keyof typeof LOG_CATEGORIES;

/** FlightRecorder の1エントリ。構造化データのみ、文字列なし。 */
export type FlightRecorderEntry = {
  /** performance.now() のタイムスタンプ */
  t: number;
  /** LogLevel の数値 */
  level: number;
  /** LogCategory の数値 */
  cat: number;
  /** 短いイベントタグ（例: "gps.position", "route.saved"） */
  tag: string;
  /** 構造化データ（文字列に変換しない） */
  data?: unknown;
};

/** dump 時のフォーマット済みエントリ */
export type FormattedLogEntry = {
  timestamp: string;
  level: LogLevelName;
  category: LogCategoryName;
  tag: string;
  data?: unknown;
};

/** verify() の出力型 */
export type VerifyResult = {
  bufferSize: number;
  entryCount: number;
  oldestAgeMs: number | null;
  levelCounts: Record<LogLevelName, number>;
  categoryCounts: Record<string, number>;
  lastEntries: FormattedLogEntry[];
  duplicates: string[];
  missingCategories: LogCategoryName[];
};
