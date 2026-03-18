# FlexRoute 画面仕様書

> 最終更新: 2026-03-16

## 画面一覧

| 画面ID | 画面名 | 説明 | 実装状態 |
|--------|--------|------|---------|
| S-TOP | TOP画面 | ルート/ラベル/場所の一覧。地図なし | ✅ |
| S-EDIT | ルート編集画面 | サイドバー + 地図。ウェイポイント管理 | ✅ |
| S-NAV | ナビゲーション画面 | 地図フルスクリーン。GPS追従 | 未実装（1-6） |
| M-SEARCH | 検索モーダル | 場所検索してウェイポイント追加 | ✅ |
| M-CONFIRM | 確認ダイアログ | 削除等の確認 | ✅ |
| M-PLACE | 場所アクションモーダル | Placeタップ時の操作選択 | ✅ |

## 画面遷移図

```
S-TOP → 「新規作成」ボタン → S-EDIT（空ルート、ルート名空）
S-TOP → ルートカードタップ → S-EDIT（選択ルートをロード）

S-EDIT → 「←」戻るボタン → S-TOP
  保存条件成立（WP1件以上 or 名前非空） → 保存してから遷移
  新規 + 条件不成立 → 破棄して遷移
  既存 + 条件不成立 → そのまま遷移（上書きしていないので安全）

S-EDIT → 「ナビ開始」ボタン → S-NAV（1-6で実装）
S-EDIT → 「経路を追加」ボタン → M-SEARCH（insertIndex = null → 末尾追加）
S-EDIT → ウェイポイント間「+」ボタン → M-SEARCH（insertIndex = index + 1）
S-EDIT → 地図タップ（Place以外） → ウェイポイント即追加（座標ベース、名前は「lat, lng」形式）
S-EDIT → 地図タップ（Placeアイコン） → 下記「Placeアイコンタップの暫定/将来動作」参照

S-NAV → 「終了」ボタン → S-EDIT（1-6で実装）

M-SEARCH → 場所選択 → M-SEARCH閉じる + ウェイポイント追加（insertIndex位置 or 末尾）
M-SEARCH → 「×」ボタン → M-SEARCH閉じる（insertIndex クリア）

M-CONFIRM → 「削除する」 → 実行 + M-CONFIRM閉じる
M-CONFIRM → 「キャンセル」 → M-CONFIRM閉じる
```

## S-TOP: TOP画面

### レイアウト

- 地図は表示しない。フルスクリーンのリスト画面
- ヘッダー: bg-indigo-600、テキスト白、アプリ名「FlexRoute」
- ヘッダー下: タブバー（ルート / ラベル / 場所）
  - デザイン: DESIGN_REFERENCE セクション6 準拠
  - アクティブ: bg-white text-indigo-600 shadow-sm
  - 非アクティブ: text-slate-500 hover:text-slate-700
- タブ下: コンテンツエリア（bg-slate-50、flex-1、overflow-y-auto、max-w-5xl中央寄せ）

### タブ: ルート

- ルート一覧（routeStore.savedRoutes）
- 右上: タイル/リスト切替トグル（DESIGN_REFERENCE セクション7）+ 新規作成ボタン（DESIGN_REFERENCE セクション8）
- ルートカード（DESIGN_REFERENCE セクション17）
  - タップ → loadRoute → S-EDITへ遷移
  - 削除ボタン → M-CONFIRM
  - 名前がtrim()で空 → 「名称未設定」表示
- 0件時: 空状態メッセージ（DESIGN_REFERENCE セクション18）

### 将来追加予定のタブ
- 「走行記録」タブ（1-6後の追加マイルストーンで実装）
- タブ構成は ルート / ラベル / 場所 / 走行記録 の4タブになる
- 詳細は SPEC_NAVIGATION.md の「走行記録画面」セクションを参照

### タブ: ラベル

- ラベル一覧（LabelList）。タイル / リスト表示切替
- LabelCard / LabelRow に紐付きルート+場所の件数を実データから表示
- ラベルタップ → LabelEditModal（ボトムシート型、z-[100]、animate-slide-up）
- 既存ラベル編集時: フォーム下部に紐付きルート・場所のリスト（LabelLinkedItems）を表示
  - ルートタップ → モーダルを閉じてルート編集画面へ遷移
  - 場所タップ → モーダルを閉じて PlaceDetailModal を開く
- 新規ラベル作成時: 紐付きリストは非表示

### タブ: 場所

- 保存済み場所の一覧を表示（PlaceList）
- タイル / リスト表示切替（ViewToggle）
- タイル: 写真（h-20）、施設名、住所、メモ、ラベルチップ
- リスト: サムネイル写真（w-24 h-16、カード共通仕様）、施設名、住所、メモ
- タップ → PlaceDetailModal を開く
- 0件時: EmptyState（「保存された場所はありません」）

## S-EDIT: ルート編集画面

### レイアウト（PC 768px以上）

- 左: サイドバー（w-96）
- 右: 地図（残り全幅）

### レイアウト（モバイル 768px未満、1-7で実装）

- 地図フルスクリーン
- ボトムシート（3段階: full=5%, half=50%, min=85%）

#### ボトムシートのドラッグ操作仕様

3段階のシート位置（画面上部からの%位置）:
- **full**: y = 5%（ほぼ全画面。ウェイポイントリスト全体が見える）
- **half**: y = 50%（半分。ルート概要が見える）
- **min**: y = 85%（最小化。ヘッダーのみ見える）

初期位置: half

ドラッグ制御: framer-motion の `drag="y"` + `useDragControls`

遷移判定:
- 下方向スワイプ（offset > 50px or velocity > 500px/s）:
  - full → half
  - half → min
- 上方向スワイプ（offset < -50px or velocity < -500px/s）:
  - min → half
  - half → full
- 閾値未満のドラッグ → 元の位置に戻る（スプリングアニメーション）

ドラッグハンドル:
- シート上部に配置
- `bg-indigo-600 rounded-t-3xl cursor-grab active:cursor-grabbing`
- 中央に白いバー: `w-12 h-1.5 bg-white/40 rounded-full`

アニメーション:
- `type: "spring", bounce: 0, duration: 0.4`

TOP画面（viewMode === 'top'）のとき:
- ボトムシートは使用しない。フルスクリーンのリスト画面

### サイドバー構成（上から順に）

1. ヘッダー（bg-indigo-600 text-white）
   - 「←」戻るボタン: 戻る際に入力欄のblurを先に発火させてから遷移
   - ルート名入力欄: DESIGN_REFERENCE セクション11 のスタイル
     - routeStore.currentRoute.name を表示・編集
     - onChange → routeStore.setRouteName()（メモリ上のみ更新）
     - onBlur → 保存条件成立なら saveCurrentRoute()
     - プレースホルダー「ルート名を入力...」

2. ウェイポイントリスト
   - 各ウェイポイント（WaypointItem）:
     - 左: GripVerticalドラッグハンドル（cursor-grab）
     - 色分けドット: 最初=緑(#10b981)、最後=赤(#f43f5e)、中間=黄(#f59e0b)
     - 名前表示（truncate）
     - isCurrentLocation → 「現在地」サブテキスト（text-emerald-600）
     - 右: 削除ボタン（Xアイコン、hover:text-rose-500）
   - ウェイポイント間: 縦線コネクタ（w-0.5 h-4 bg-slate-200）+ 「+」挿入ボタン
   - ドラッグ＆ドロップ並び替え（framer-motion Reorder）

3. 「経路を追加」ボタン
   - border-2 border-dashed border-slate-200 rounded-xl
   - Plus アイコン + テキスト
   - タップ → M-SEARCH（insertIndex = null）

4. RouteSummary（ウェイポイント2つ以上のとき表示）
   - DESIGN_REFERENCE セクション12 のスタイル
   - 距離: formatDistance() → 「X.Xkm」or「XXXm」
   - 時間: formatDuration() → 「X時間XX分」or「XX分」
   - 「ナビ開始」ボタン（ルート計算済み時のみ有効）
   - 計算中: animate-pulse「ルート計算中...」
   - エラー: text-red-300 でメッセージ

### ルートポリラインのクリーンアップ
- ウェイポイントが1件以下になった場合、既存ポリラインを全てクリアし、routeStore の routeData も null にする
- TOP画面に戻る時（RouteEditor の戻るボタン）、clearRouteData() でポリラインデータを初期化する
- 新規ルート作成時も clearRouteData() でポリラインを初期化する
- RoutePolyline コンポーネントのアンマウント時にもポリラインをクリアする（useEffect クリーンアップ）

### Placeアイコンタップの動作

- Placeアイコンタップ → PlaceActionModal（M-PLACE）を表示
- 施設写真・名前・住所・評価を表示
- ユーザーが選択: 「経路に追加」「ラベルを付ける」「ナビ開始」
- 「経路に追加」選択時のみウェイポイント追加

### 地図上の要素

- ウェイポイントマーカー（WaypointMarkers）: AdvancedMarker + Pin、色分け
- ルートポリライン（RoutePolyline）: 道路種別色分け、ステップ単位で描画
- 現在地マーカー（CurrentLocationMarker）: DESIGN_REFERENCE セクション1、常時表示、ZIndex=100

### MapViewState（src/components/map/MapViewState.tsx）

useMapViewState フックのマウント用コンポーネント。MapView 内で使用。
地図の center/zoom を保存・復元する。

### 地図の初期表示

- ウェイポイントなし: lastKnownPosition（localStorage）で初期センタリング（D-020 参照）
- ウェイポイントあり: fitBounds（全WPが収まるズーム、padding: 80）
- ウェイポイント1つ: そのポイント中心、ズーム15

## M-SEARCH: 検索モーダル

- 表示条件: uiStore.searchModalOpen === true
- DESIGN_REFERENCE セクション14, 15, 16 のスタイル
- タイトル: insertIndex あり → 「経由地を挿入」、なし → 「経路を追加」
- Google Places Autocomplete API で検索
- 候補選択 → addWaypoint(wp, insertIndex) → モーダル閉じる
- 「×」→ モーダル閉じる + insertIndex クリア

## M-CONFIRM: 確認ダイアログ

- 表示条件: uiStore.confirmDialog.isOpen === true
- DESIGN_REFERENCE セクション13 のスタイル
- メッセージ + 2ボタン（キャンセル / 削除する）

## S-NAV: ナビゲーション画面（1-6で実装）

- 仕様は SPEC_NAVIGATION.md に記載

## M-PLACE: 場所アクションモーダル（1-5で実装）

- Placeアイコンタップ時に表示
- 施設写真・名前・住所・評価
- 「経路に追加」「ラベルを付ける」「ナビ開始」ボタン

### PlaceSaveStep（src/components/places/PlaceSaveStep.tsx）

PlaceActionModal 内の保存ステップ。名前入力 + ラベル選択（チェックボックス） + メモ入力。
「場所を保存」タップで表示。保存完了でモーダルを閉じる。

### PlaceDetailModal（src/components/places/PlaceDetailModal.tsx）

保存済み場所の詳細表示・編集モーダル。場所一覧からタップで開く。
- 写真、施設名、originalName（名前変更時のみ表示）、住所、評価
- ラベル編集（PlaceLabelEditor）、メモ blur 保存、場所削除

### PlaceLabelEditor（src/components/places/PlaceLabelEditor.tsx）

PlaceDetailModal 内のラベル編集コンポーネント。チェックボックスで付け外し、即時保存。
