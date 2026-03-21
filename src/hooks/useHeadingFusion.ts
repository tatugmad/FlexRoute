/**
 * useHeadingFusion — GPS heading と磁気 heading の融合フック
 *
 * === 現在の実装 ===
 * GPS heading（GeolocationPosition.coords.heading）のみ使用。
 * handlePosition が navigationStore.heading にセットする値がそのまま使われる。
 * このフックは現時点では何もしない。
 *
 * === 将来の実装（DeviceOrientation 追加時） ===
 *
 * 1. このフック内で DeviceOrientationEvent を addEventListener する。
 *    sim 環境では simDeviceOrientation.ts がこの API をパッチ済み。
 *    addEventListener は本物でも sim でも同じコードで動作する。
 *
 * 2. GPS heading は navigationStore.heading から読み取る（handlePosition が書く値）。
 *    ただし、融合結果を heading に書き戻すと循環するため、
 *    以下のいずれかで解決する:
 *    a) navigationStore に gpsHeading（入力）と heading（融合結果）を分離する
 *    b) handlePosition が heading ではなく本フックの受け口関数に GPS heading を渡す
 *    c) 本フック内で「自分が書いた値」を ref で記憶し、store 変更が自分由来なら無視する
 *
 * 3. 融合ロジック（speed に応じたソース選択）:
 *    - speed > 閾値 → GPS heading を優先（移動中は GPS が正確）
 *    - speed ≈ 0    → 磁気 heading を使用（静止中でも方位がわかる）
 *    - 遷移区間    → ブレンド（急な切替を避ける）
 *
 * 4. 融合結果を navigationStore.heading にセットする。
 *    PG の他のコンポーネント（Map heading prop, HeadingButton, CurrentLocationMarker）は
 *    navigationStore.heading を読むだけなので変更不要。
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function useHeadingFusion(): void {
  // 現時点では何もしない。
  // DeviceOrientation 実装時にこのフックにロジックを追加する。
}
