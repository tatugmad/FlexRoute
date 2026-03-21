/**
 * ログ参照レベルの設定 (D-033)
 *
 * 記録は常に全レベル行う。このモジュールは「コンソールに
 * 何を表示するか」の参照レベルを管理する。
 *
 * Phase 1: URL の ?log パラメータから読み取る
 * 将来: localStorage / サーバ設定 / 設定画面にも対応可能
 */
import { LOG_LEVELS } from "@/types/log";
import type { LogLevelName } from "@/types/log";

export type LogConfig = {
  /** この数値以上のレベルをコンソールに出力する */
  consoleLevel: number;
  /** DebugPanel を表示するか */
  isDebugPanelEnabled: boolean;
  /** ?log パラメータの生の値（デバッグ用） */
  rawParam: string | null;
};

/**
 * URL パラメータからログ設定を生成する。
 *
 * ?log なし      → consoleLevel = warn(3), panel = false
 * ?log=trace     → consoleLevel = trace(0), panel = true
 * ?log=debug     → consoleLevel = debug(1), panel = true
 * ?log=info      → consoleLevel = info(2), panel = true
 * ?log=warn      → consoleLevel = warn(3), panel = true
 * ?log=error     → consoleLevel = error(4), panel = true
 * ?log（値なし）  → consoleLevel = info(2), panel = true
 * ?debug（sim用）→ panel = true（consoleLevel はデフォルト維持）
 */
export function createLogConfig(): LogConfig {
  const params = new URLSearchParams(window.location.search);
  const logParam = params.get("log");
  const hasDebug = params.has("debug");

  let consoleLevel: number = LOG_LEVELS.warn; // デフォルト: warn 以上のみ
  let isDebugPanelEnabled = false;

  if (logParam !== null) {
    const level = logParam as LogLevelName;
    if (level in LOG_LEVELS) {
      consoleLevel = LOG_LEVELS[level];
    } else {
      // ?log（値なし）or 不正値 → info
      consoleLevel = LOG_LEVELS.info;
    }
    isDebugPanelEnabled = true;
  }

  if (hasDebug) {
    isDebugPanelEnabled = true;
  }

  return {
    consoleLevel,
    isDebugPanelEnabled,
    rawParam: logParam,
  };
}
