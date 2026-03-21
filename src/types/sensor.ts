/**
 * FlexRoute SensorBridge 型定義
 *
 * sim は browser API をパッチして PG に割り込む。
 * PG のコードに sim の痕跡を残さない。
 * sim は原因（callback パターン）を再現し、結果（PG の状態）を直接操作しない。
 *
 * --- パッチパターン分類 ---
 *
 * Watch 型:
 *   対象 API が callback 登録 → 定期呼び出しを行う。
 *   sim はタイマーで callback 配信間隔を制御する。
 *   例: navigator.geolocation.watchPosition
 *   パッチファイル: src/services/simGeolocation.ts
 *
 * Event 型:
 *   対象 API が addEventListener で event を受け取る。
 *   sim は addEventListener をパッチし、fake event を dispatch する。
 *   例: window.addEventListener('deviceorientation', ...)
 *   パッチファイル: src/services/simDeviceOrientation.ts（将来）
 *
 * Request 型:
 *   対象 API が単発の Promise / 戻り値を返す。
 *   sim は戻り値やエラーを差し替える。
 *   例: navigator.wakeLock.request()
 *   パッチファイル: src/services/simWakeLock.ts（将来）
 *
 * Property 型:
 *   対象 API が getter プロパティで値を返す。
 *   sim は getter をパッチし、読み取り値を差し替える。
 *   例: navigator.onLine, document.visibilityState
 *   パッチファイル: src/services/simNetwork.ts（将来）
 */
/** チャンネルごとの動作モード */
export type SensorMode = 'real' | 'sim';
/**
 * D-pad（position 変更）の callback 配信モード
 * sync:     操作のたびに即座に callback を PG に送る
 * interval: interval タイマーの次の tick で配信（GPS の挙動に近い）
 * lost:     interval タイマーの tick を空振りさせ callback を送らない
 *           PG の lostTimer が自然に GPS lost を検知する
 */
export type PositionCallbackMode = 'sync' | 'interval' | 'lost';
/**
 * チャンネル別モード設定
 *
 * 各チャンネルは独立に real/sim を切り替えられる。
 * チャンネル名はパッチ対象の browser API ごとにグループ化している。
 */
export type SensorChannelModes = {
  // ---- Geolocation API (Watch 型) ----
  // パッチ: src/services/simGeolocation.ts
  // coords.latitude / coords.longitude / coords.accuracy
  position: SensorMode;
  // coords.heading（GPS 由来の進行方向。移動中のみ有効）
  heading: SensorMode;
  // coords.speed（GPS 由来の移動速度）
  speed: SensorMode;
  // ---- DeviceOrientation API (Event 型) ----
  // パッチ: src/services/simDeviceOrientation.ts（将来）
  // event.alpha（磁気センサー由来の方位。静止中も 60Hz で更新）
  // PG の heading 融合ロジック（useHeadingFusion）が GPS heading と
  // 磁気 heading を speed 等に応じて選択・統合する
  magneticHeading: SensorMode;
  // ---- Network Information API (Event 型 + Property 型) ----
  // パッチ: src/services/simNetwork.ts（将来）
  // navigator.connection の change イベント + navigator.onLine getter
  // 用途: オフラインナビ切替、地図タイルキャッシュ判断
  network: SensorMode;
  // ---- Battery Status API (Request 型) ----
  // パッチ: src/services/simBattery.ts（将来）
  // navigator.getBattery() の Promise 戻り値
  // 用途: 省電力モード（GPS 更新頻度低下等）
  battery: SensorMode;
  // ---- Screen Orientation API (Event 型) ----
  // パッチ: src/services/simOrientation.ts（将来）
  // screen.orientation の change イベント
  // 用途: UI レイアウト切替
  screenOrientation: SensorMode;
  // ---- Screen Wake Lock API (Request 型) ----
  // パッチ: src/services/simWakeLock.ts（将来）
  // navigator.wakeLock.request() の成否制御
  // 用途: ナビ中の画面消灯防止
  wakeLock: SensorMode;
  // ---- Page Visibility API (Event 型 + Property 型) ----
  // パッチ: src/services/simVisibility.ts（将来）
  // document.visibilityState getter + visibilitychange イベント
  // 用途: バックグラウンド検知 → GPS 記録継続判断
  visibility: SensorMode;
  // ---- DeviceMotion API (Event 型) ----
  // パッチ: src/services/simDeviceMotion.ts（将来）
  // DeviceMotionEvent（加速度・ジャイロ）
  // 用途: トンネル内の推測航法（dead reckoning）
  deviceMotion: SensorMode;
  // ---- Vibration API (Request 型) ----
  // パッチ: src/services/simVibration.ts（将来）
  // navigator.vibrate() の成否制御
  // 用途: ターン通知のハプティクスフィードバック
  vibration: SensorMode;
  // ---- Ambient Light Sensor API (Event 型) ----
  // パッチ: src/services/simAmbientLight.ts（将来）
  // AmbientLightSensor の reading イベント
  // 用途: 昼夜の地図テーマ自動切替
  // 注意: ブラウザサポートが限定的（Chrome のみ）
  ambientLight: SensorMode;
};
/** sim モード時の値（実装済みチャンネルのみ） */
export type SimValues = {
  // ---- Geolocation API ----
  position: { lat: number; lng: number } | null;
  heading: number;
  speed: number;                       // m/s
  accuracy: number;                    // meters
  callbackIntervalMs: number;          // success callback の発火間隔（ms）
  denied: boolean;                     // true で error callback (PERMISSION_DENIED) を送る
  positionCallbackMode: PositionCallbackMode;
  headingSync: boolean;                // true: heading 変更で即時 callback（GPS 挙動と異なるが操作の便宜）
  speedSync: boolean;                  // true: speed 変更で即時 callback（同上）
};
