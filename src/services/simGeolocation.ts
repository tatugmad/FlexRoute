/**
 * SimGeolocation — navigator.geolocation のパッチ層
 *
 * install() で navigator.geolocation のメソッドをパッチし、
 * 全呼び出しをオリジナル API に転送する（パススルー）。
 *
 * Phase 2b で intercept ロジックを追加し、
 * sim ON 時に値の混合・lost/denied 模擬を行う。
 */

let installed = false;
let originalWatchPosition: typeof navigator.geolocation.watchPosition | null = null;
let originalGetCurrentPosition: typeof navigator.geolocation.getCurrentPosition | null = null;
let originalClearWatch: typeof navigator.geolocation.clearWatch | null = null;

/** パッチをインストール（React render 前に1回だけ呼ぶ） */
export function installSimGeolocation(): void {
  if (installed) return;
  if (!navigator.geolocation) return;

  // オリジナルを保存
  originalWatchPosition = navigator.geolocation.watchPosition.bind(navigator.geolocation);
  originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  originalClearWatch = navigator.geolocation.clearWatch.bind(navigator.geolocation);

  // パッチ: 全呼び出しをオリジナルに転送
  navigator.geolocation.watchPosition = function patchedWatchPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): number {
    return originalWatchPosition!(success, error ?? undefined, options);
  };

  navigator.geolocation.getCurrentPosition = function patchedGetCurrentPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): void {
    originalGetCurrentPosition!(success, error ?? undefined, options);
  };

  navigator.geolocation.clearWatch = function patchedClearWatch(id: number): void {
    originalClearWatch!(id);
  };

  installed = true;
}
