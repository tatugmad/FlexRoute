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
/** チャンネル別モード設定 */
export type SensorChannelModes = {
  position: SensorMode;
  heading: SensorMode;
  speed: SensorMode;
  // Phase 2 以降（今は使わないが型だけ定義）
  network: SensorMode;
  battery: SensorMode;
  orientation: SensorMode;
};
/** sim モード時の値 */
export type SimValues = {
  position: { lat: number; lng: number } | null;
  heading: number;
  speed: number;                       // m/s
  accuracy: number;                    // meters
  callbackIntervalMs: number;          // success callback の発火間隔（ms）
  denied: boolean;                     // true で error callback (PERMISSION_DENIED) を送る
  positionCallbackMode: PositionCallbackMode;  // D-pad の callback 配信モード
  headingSync: boolean;                // true: heading 変更で即時 callback
  speedSync: boolean;                  // true: speed 変更で即時 callback
};
