/** チャンネルごとの動作モード */
export type SensorMode = 'real' | 'sim';

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
  speed: number;           // m/s
  accuracy: number;        // meters
  callbackIntervalMs: number;  // success callback の発火間隔（ms）
  denied: boolean;             // true で error callback (PERMISSION_DENIED) を送る
};
