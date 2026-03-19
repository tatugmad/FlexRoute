# FlexRoute ナビゲーション仕様書

> 最終更新: 2026-03-19

## 保存ルートによるナビゲーション

SavedRoute に legs/steps を保存しているため、ナビ時に Routes API を再呼出しない。
保存されたポリラインをそのまま描画し、保存された案内文をそのまま表示する。
これにより「ユーザーが決定したルートが変わらないナビゲーション」を実現する。

**これは FlexRoute の重要なセールスポイントである。**

Google Maps 等の一般的なナビアプリは、ナビ開始時や走行中にルートを再計算し、
ユーザーが意図しない経路に変更されることがある。
FlexRoute はルート計算結果をステップ単位で永続化し、ナビ時はそのデータのみで案内する。

### ルートデータの保存構造

```
SavedRoute {
  id: string
  name: string
  waypoints: Waypoint[]
  travelMode: TravelMode
  encodedPolyline: string          // ルート全体のポリライン
  legs: SavedRouteLeg[]            // ウェイポイント間の区間
  version: number
  createdAt: string
  updatedAt: string
}

SavedRouteLeg {
  startWaypointIndex: number       // 開始ウェイポイントのインデックス
  endWaypointIndex: number         // 終了ウェイポイントのインデックス
  distanceMeters: number
  durationSeconds: number
  steps: SavedRouteStep[]
}

SavedRouteStep {
  encodedPolyline: string          // この区間のポリライン
  roadType: RoadType               // 道路種別（highway/national/prefectural/local）
  instruction: string              // 案内文（「国道254号を左折」等）
  distanceMeters: number
  durationSeconds: number
}
```

## 追従モード状態マシン

| モード | 動作 | 遷移条件 |
|--------|------|----------|
| auto | 現在地を中心に自動追従 | ユーザーのドラッグ/ズーム操作を検知 → free |
| free | ユーザーが自由に地図操作 | 明示的なボタン操作 → auto |

操作ロックタイマー（200ms等）は使用しない（アンチパターン禁止2）。
状態マシンで管理する。

## ズーム制御

| モード | 動作 |
|--------|------|
| autoZoom | 速度や状況に応じて自動ズーム |
| lockedZoom | ユーザー手動設定のズームを固定 |

アイコンデザイン: DESIGN_REFERENCE セクション3

## ヘッディング制御

| モード | 動作 |
|--------|------|
| headingUp | 進行方向が上になるよう地図回転 |
| northUp | 常に北が上（デフォルト） |

アイコンデザイン: DESIGN_REFERENCE セクション2

## オートズーム（D-023）

### ベースライン: 時間先読みモデル

現在速度で走行した場合に「画面上端に15秒後の地点が見える」ズームレベルを算出する。

計算式:
- 表示距離 = speed(m/s) × 15
- ズームレベル = 表示距離から地図スケールを逆算

速度変化に応じてズームが連続的に変化する。急激なズーム変化を防ぐため、1回の更新でのズーム変化量は最大±0.5レベルに制限し、4.5秒以上の間隔を空ける（OsmAnd準拠）。

lockedZoomモード時はベースラインを適用しない（ユーザー設定のズームを固定）。

### オーバーレイ: ターン接近ズーム

次のステップ（案内指示）までの距離に応じてズームインする。

| 距離 | 動作 |
|------|------|
| 300m超 | ベースラインのみ |
| 300m〜100m | 線形補間でズームイン開始 |
| 100m以下 | ベースライン + 2レベル（上限 z18） |
| ステップ通過後 | 0.5秒アニメーションでベースラインに復帰 |

lockedZoomモード時はターン接近ズームも適用しない。

### 鳥瞰図（tilt）制御（D-024）

| 設定 | tilt | heading | 用途 |
|------|------|---------|------|
| headingUp + tilt ON | 45° | 進行方向 | カーナビ風鳥瞰図 |
| headingUp + tilt OFF | 0° | 進行方向 | 2D進行方向上 |
| northUp | 0° | 0（北） | 2D北上 |

tilt ON/OFFの切替はヘッディング制御ボタンの長押し、またはナビ設定で切り替える（UIの具体案はStep 1実装時に確定）。

## 追従モード制御アイコン

DESIGN_REFERENCE セクション4

## ワイプマップ

ナビ中にルート全体を俯瞰する小マップ。

### 位置（進行方向に応じて動的配置）

| 進行方向 | ワイプ位置 |
|----------|-----------|
| 南東へ移動 | 左下 |
| 北東へ移動 | 左下 |
| 南西へ移動 | 右下 |
| その他 | 右上（デフォルト） |

### サイズ

| 条件 | サイズ |
|------|--------|
| 通常 | w-40 h-40 |
| ルート距離50km超 | w-56 h-56 |

### イベント伝播

stopPropagation で分離。
`gestureHandling="none"` は使用しない（アンチパターン禁止4）。

## ナビゲーションヘッダー

DESIGN_REFERENCE セクション5

表示情報:
- 到着予想時間
- 残り距離
- 現在速度（km/h）

## 逸脱検知とリルート

### 逸脱判定

閾値: 保存ルートのポリラインから **50m** 離れたら逸脱判定。

### 逸脱検知時ダイアログ（3選択肢）

1. **逸脱地点に戻る**
   - 未通過の直近ステップの開始地点に向かうルートを計算
   - ステップ通過管理（StepPassage）により未通過ステップを特定

2. **次の経由地までリルート**（デフォルト — 一定時間選択なければ自動選択）
   - 現在地から次のウェイポイントまで Routes API でルート計算
   - 未通過ステップは未通過のまま保持（スキップ扱い）

3. **目的地までリルート**
   - 現在地から残り全ウェイポイント経由で目的地まで Routes API 計算
   - 未通過ステップは未通過のまま保持

### ポリライン表示デザイン

| 種類 | スタイル |
|------|---------|
| 通過済み | 元の色で opacity 0.3 |
| 未通過 | 元の色のまま |
| リルート | グレー破線（#9ca3af）、太さ4、opacity 0.6 |

## ステップ通過管理

navigationStore で管理（保存データには含めない）。
通過判定は boolean ではなく、出口通過時のタイムスタンプと位置を記録する。

### StepPassage

```
StepPassage {
  legIndex: number
  stepIndex: number
  exitTimestamp: string            // ISO 8601（出口通過時刻）
  exitPosition: LatLng             // 通過時の実GPS座標
}
```

### 活用方法

- 区間ごとの実所要時間 = step[n+1].exitTimestamp - step[n].exitTimestamp
- 予定時間との比較（渋滞検知）
- 区間ごとの平均速度算出
- 同じルートの過去データとの比較

### navigationStore に追加する状態

```
currentLegIndex: number
currentStepIndex: number
stepPassages: StepPassage[]
isOffRoute: boolean
offRouteDistance: number            // ルートからの距離（メートル）
reroutePolyline: string | null     // リルート時の一時ポリライン
```

## クイック検索カテゴリ（ナビ中に表示）

- ガソリンスタンド
- コンビニ
- トイレ
- レストラン

## 現在地測位: 2系統並走方式

### 設計方針

GPS（主系）と Wifi/IP（副系）の2本の watchPosition を並走させる。
詳細は SPEC_FEATURES.md の F-LOC を参照。

### 地図初期表示（ウェイポイントなしの場合）

1. **キャッシュ確認**: navigationStore.currentPosition があれば即座に使用（測位スキップ）
2. **2系統並走開始**: 副系（Wifi/IP）が先に返ることが多い → 即座に地図表示
3. **主系（GPS）取得後**: panTo で高精度位置に移動
4. **両方失敗**: 東京（35.6895, 139.6917）をデフォルト表示

### ウェイポイントありの場合

- fitBounds（全WPが収まるズーム、padding: 80）
- ウェイポイント1つ: その点を中心にズーム15

**ローディング画面（グルグル）は使用しない。地図は必ず即座に描画する。**

## GPSログ記録

アプリ起動中は常にGPSログを記録する。ON/OFF選択肢はUIに設けない。

### GpsLog 型

```
GpsLog {
  id: string
  type: 'navigation' | 'tracking'
  routeId: string | null           // navigation の場合のみルートに紐付く
  date: string                     // YYYY-MM-DD
  startedAt: string                // ISO 8601
  endedAt: string | null           // ISO 8601
  rawPath: TravelPoint[]           // 生データ（全GPS座標）
  simplifiedPath: TravelPoint[] | null  // 間引き済み（保存・表示・エクスポート用）
  stepPassages: StepPassage[] | null    // navigation の場合のみ
  totalDistanceMeters: number
  totalDurationSeconds: number
  averageSpeedKmh: number
}
```

### type の使い分け

| type | 開始/終了 | routeId | stepPassages |
|------|----------|---------|-------------|
| navigation | ナビ開始で記録開始、ナビ終了で記録終了 | あり | あり |
| tracking | アプリ起動中に一定距離以上移動したら自動記録 | なし | なし |

### TravelPoint 型

```
TravelPoint {
  lat: number
  lng: number
  timestamp: string                // ISO 8601
  speed: number | null             // km/h
  heading: number | null           // 度
  accuracy: number | null          // GPS精度（メートル）
}
```

### GPS記録の方針

- watchPosition が返す全座標を rawPath に追加する
- 前回記録点から **3m未満** は除外（GPSジッターのノイズ除去。3mはヘアピンカーブも十分トレースできる粒度）
- ブラウザ: OS判断で約1〜3秒間隔（watchPosition は呼び出し間隔を指定できない。フェーズ1の制約）
- ネイティブ（フェーズ2）: 1秒間隔の明示指定で精度向上
- 停車中もGPS通知がある限り記録する（停車判定・タイムスタンプの連続性のため）
- 同一座標の連続（前回と完全一致）は除外する

### 保存時の間引き

Douglas-Peucker アルゴリズムで simplifiedPath を生成。

- tolerance = 0.00005（約5m）
- 直線区間: 大幅に間引かれる
- カーブ区間: 曲率に応じて密に残る（ヘアピンも正確にトレース）
- Google Earth での経路再現性を重視した閾値

生データ（rawPath）は破棄しない。
後から閾値を変えて再間引き・再エクスポートが可能。

## 走行記録画面（1-6後追加で実装）

### 画面構成

TOP画面に「走行記録」タブを追加（ルート / ラベル / 場所 / 走行記録）。

### フィルタ方法

| フィルタ | 動作 |
|---------|------|
| ルートで選択 | ルート一覧から選択 → そのルートに紐付く走行記録を表示 |
| 日付で選択 | カレンダーまたは日付範囲指定 → 該当日のログ一覧 |
| 全て | 全ログ一覧（日付降順） |

### ログ一覧

- 複数選択可能（チェックボックス）
- 各ログに日付、ルート名（あれば）、type（ナビ/トラッキング）、距離、時間を表示
- 全選択 / 全解除ボタン

### 地図表示

- 選択したログを地図に Polyline で重ねて表示
- 各ログに異なる色を自動割り当て
- 凡例表示
- 通常の Google Maps Polyline で十分（同時に十数本程度を想定）

### アクション

- KMLエクスポート（選択中のログを1ファイルに）
- 削除

## ルート編集画面の表示レイヤー切替（1-6後追加で実装）

地図上に表示レイヤー切替パネルを設ける。

```
表示オプション:
  ☑ 予定ルート（ポリライン）  ← OFF で予定ルートの線を非表示
  ☑ ウェイポイント（ピン）    ← OFF でピンを非表示
  ☐ 走行記録                ← ON で日付選択UIが展開
    ├── ☑ 2026-03-10
    ├── ☐ 2026-03-08
    └── 全選択 / 全解除
```

### 走行記録の表示デザイン

- 各日付に異なる色を自動割り当て
- 半透明（opacity: 0.4）で予定ルートの下に表示
- 予定ルートやピンを非表示にして走行記録だけ見ることも可能

## KMLエクスポート（1-6後追加で実装）

Google Earth が読める KML 形式で出力する。

### KMLファイル構成

```
Document
├── Folder: 予定ルート（該当ルートがあれば）
│   └── Placemark: 道路種別ごとにポリライン（KML色は AABBGGRR 形式）
├── Folder: 実走ルート
│   └── Placemark: 各走行記録の LineString（simplifiedPath の座標）
└── Folder: ウェイポイント
    └── Placemark: 各ウェイポイントの Point
```

KML の色は **AABBGGRR** 形式（Google Earth の仕様。RGBではなくBGR順）。
simplifiedPath の座標を LineString の coordinates に出力する。

## クモの巣走破地図（フェーズ2で実装）

### コンセプト

過去の全走行記録を日本地図に重ねて表示する。
走った道が色付きの線で塗られ、走っていない地域は白いまま。

想定ユースケース: 「東北はまだ真っ白だな、次は東北に行こう」

### 性能要件

数十年分（1,500回以上、300万点以上）の走行データを
ブラウザおよびスマホで **60fps** で軽快に描画すること。
Google Earth と同等以上の性能を実現する。

### アーキテクチャ

#### 描画

deck.gl PathLayer + Google Maps Overlay（WebGL GPU描画）
- WebGL（GPU並列処理）により数百万本の線分を1回の draw call で描画
- Google Maps との公式統合（GoogleMapsOverlay）
- React 対応（@deck.gl/react）

#### データ構造: ズームレベル別LOD（Level of Detail）

| ズームレベル | 対象 | tolerance | データ量 |
|-------------|------|-----------|---------|
| 低（日本全体） | tolerance 大 | 大 | 数万点 |
| 中（地方レベル） | tolerance 中 | 中 | 数十万点 |
| 高（市街地） | tolerance 小 | 小 | 全データ |

ズーム変更時に適切な解像度のデータセットに切替。

#### タイル化

- 表示範囲外のデータは読み込まない
- スクロール・ズームに応じて必要なタイルだけ動的読込
- 初期読込が数十年分のデータでも遅くならない

#### 集約データの更新

- 新しい走行記録が追加されるたびに増分更新
- 全データを再計算する必要はない

### 表示デザイン

| 要素 | スタイル |
|------|---------|
| 走った道 | インディゴ（#4f46e5, opacity: 0.6） |
| 複数回走った道 | 線が太く or 色が濃くなる（走行回数に応じて） |
| 走っていない道 | 何も描画されない（地図の白い部分） |

### フィルタ

- 期間: 今月 / 今年 / 全期間 / カスタム範囲
- ルート別
- 将来的に: 車/バイク等のモード別

### 統計表示

- 総走行距離
- 都道府県走破率（走った道の距離の概算）
