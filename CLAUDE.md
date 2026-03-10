# FlexRoute

## プロジェクト概要

Google Maps API を使ったルート制作 & ナビ Web アプリ。
ユーザーが地図上でウェイポイントを追加・並べ替えしてルートを作成し、ターンバイターンナビゲーションで案内する。

## 技術スタック

- **フレームワーク**: React 19 + TypeScript
- **ビルド**: Vite
- **状態管理**: Zustand
- **スタイリング**: Tailwind CSS v4
- **地図**: Google Maps JavaScript API / Routes API v2

## ディレクトリ構成

```
src/
  app/              # アプリケーションルート (App.tsx, main.tsx)
  components/
    layout/         # レイアウト (Header, Sidebar, etc.)
    map/            # 地図関連コンポーネント
    route/          # ルート編集 UI
    navigation/     # ナビゲーション UI
    places/         # 場所検索・選択 UI
    top/            # トップページ
    ui/             # 汎用 UI パーツ (Button, Modal, etc.)
  stores/           # Zustand ストア
  services/         # 外部 API・ストレージ
  hooks/            # カスタムフック
  types/            # 型定義 (一元管理)
  utils/            # ユーティリティ関数
  constants/        # 定数定義
```

## 設計原則

- **1 ファイル 150 行以内**: 超える場合は分割する
- **ロジックと UI の分離**: ビジネスロジックは hooks/stores に、表示は components に
- **型定義一元管理**: 型は `src/types/` に集約し、各ファイルからインポートする
- **コンポーネント設計**: 1 コンポーネント 1 ファイル、Props は明示的に型定義

## 環境変数

| 変数名 | 説明 |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API キー |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps Map ID (Cloud スタイル用) |

## 開発コマンド

```bash
npm install       # 依存関係インストール
npm run dev       # 開発サーバー起動
npm run build     # プロダクションビルド
npm run preview   # ビルド結果プレビュー
npm run lint      # ESLint 実行
```

## コーディング規約

- インポート順序: React → 外部ライブラリ → 内部モジュール → 型
- 命名規則: コンポーネントは PascalCase、関数・変数は camelCase、型は PascalCase
- エクスポート: コンポーネントは named export を使用

## UIデザイン方針

### カラースキーム
- プライマリ: インディゴ (bg-indigo-600, text-indigo-500)
- ヘッダー/サイドバー背景: bg-indigo-600 テキスト白
- アクセントボタン（ナビ開始等）: bg-emerald-500
- 削除系ボタン: bg-rose-500
- 背景: bg-slate-50 / bg-slate-100
- カード背景: bg-white
- テキスト: text-slate-800（主）、text-slate-500（副）

### 道路種別ポリライン色分け（ルート表示の必須仕様）
- 高速道路・有料道路: #ec4899（ピンク）— navigationInstructionに「高速」「有料」「自動車道」「IC」「JCT」を含む
- 国道: #eab308（黄色）— 「国道」を含む
- 県道・都道・府道・道道: #22c55e（緑）— 「県道」「都道」「府道」「道道」を含む
- 一般道: #4f46e5（インディゴ）— 上記以外

### レイアウト
- PC（768px以上）: 左サイドバー（w-96 = 384px）+ 右に地図
- モバイル（768px未満）: 地図フルスクリーン + ボトムシート（3段階: full=5%, half=50%, min=85%）
- ボトムシートはframer-motionでドラッグ制御

### デザインリファレンス
全てのカスタムSVGアイコン、ナビUI、トップ画面のデザインは docs/DESIGN_REFERENCE.md に定義済み。
新規コンポーネント作成時は必ず参照し、記載されたデザインを完全に踏襲すること。

## アンチパターン集（踏襲禁止）

以下は旧コードの対症療法であり、新規設計の要件ではない。

### 禁止1: ポリライン簡略化ループ
正しい解決: サムネイルURLを1回生成しキャッシュ。version変更時のみ再生成

### 禁止2: 操作ロックタイマー
正しい解決: navigationStore で followMode を状態マシン管理

### 禁止3: 全ルート丸ごとシリアライズ
正しい解決: 変更ルートのみ個別保存。isDirtyフラグで検知

### 禁止4: ワイプマップ操作完全無効化
正しい解決: stopPropagation でイベント分離

### 禁止5: skipFitBounds フラグ
正しい解決: RoutePolyline と MapViewController を分離

### 禁止6: 現在地マーカーの条件付き非表示
正しい解決: 常時表示。ZIndex最上位 + デザイン差別化

### 禁止7: 巨大モノリスコンポーネント
正しい解決: 1ファイル150行以内。状態はZustand storeに分離

## データベース設計方針（フェーズ2準備）

### 命名規則
- 外部キーは参照先主キー名と一致（例: user_id）

### 履歴管理
- SavedRoute に version, createdAt, updatedAt を必ず保持
- フェーズ2ではBEFORE UPDATEトリガーで履歴テーブルに退避

### トランザクション方針
- 1操作 = 1メソッド呼び出し（StorageServiceの粒度）
- saveRoute() は waypoints + metadata をまとめて保存
- フェーズ2ではべき等性キー（X-Idempotency-Key）を全更新APIに付与

## ナビゲーション機能仕様

### 追従モード状態マシン
- auto: 現在地を中心に自動追従。ユーザー操作検知で free に遷移
- free: ユーザーが自由に地図操作。ボタン操作で auto に戻る

### ズーム制御
- autoZoom: 速度や状況に応じて自動ズーム
- lockedZoom: ユーザー手動設定のズームを固定

### ヘッディング制御
- headingUp: 進行方向が上になるよう地図回転
- northUp: 常に北が上（デフォルト）

### ワイプマップ
- ナビ中にルート全体を俯瞰する小マップ
- 位置: 進行方向に応じて動的配置（デフォルト右上）
- サイズ: 通常 w-40 h-40、50km超は w-56 h-56
- イベント伝播は stopPropagation で分離

### クイック検索カテゴリ
ガソリンスタンド、コンビニ、トイレ、レストラン

## ウェイポイント設計方針

### データ構造
ウェイポイントは1つのオブジェクトとして、経路リスト表示・地図ピン表示・ルート計算の
全てに使われる唯一のデータソースである。
目的別の別配列（名前だけの配列、座標だけの配列）を作ってはならない。

### ウェイポイント追加の2つの経路（完全分離・混同禁止）

経路A: Placeアイコンをタップした場合
- Google Maps API の click イベント仕様として、
  Placeアイコンがタップされた場合 e.detail.placeId が返される
- この placeId の存在をもって経路Aと判定する
- placeId と placeData を保持
- name にはPlace名を使用
- Places API で情報を取得する

経路B: Placeアイコン以外の地図面をタップした場合
- Google Maps API の click イベント仕様として、
  Placeアイコン以外がタップされた場合 e.detail.placeId は返されない
- placeId が存在しないことをもって経路Bと判定する
- これは「Place情報の取得に失敗した場合」ではなく、
  「そもそもPlaceではない場所をタップした」という意味である
- placeId = null（必ず明示的にnull）
- placeData = null
- name は座標表示のみ（「lat, lng」形式、小数点3桁）
- reverseGeocode は絶対に呼ばない
- Places API も絶対に呼ばない
- いかなる施設名もウェイポイント名に入れてはならない

この2つの経路は混同してはならない。
地図タップ時にreverseGeocodeやPlace検索を呼んではならない。

### 禁止事項
- 地図タップ（経路B）でreverseGeocodeを呼ぶこと
- 地図タップ（経路B）でPlaces APIを呼ぶこと
- 地図タップ（経路B）でplaceIdを設定すること
- placeId を undefined のまま放置すること（null に統一）

### PlaceData の扱い
- ウェイポイントはGoogleのPlace情報をベースに、
  FlexRoute固有の情報（ユーザーメモ、順番等）を追加で保持する
- placeData はオプショナル。Placeアイコン経由の場合のみ存在する
- フェーズ2でDB保存する際は placeData も JSONB に含める

## ナビゲーション詳細仕様

### ルートデータの保存構造

ナビ時にRoutes API を再度呼ばずに案内できるよう、
ルート計算結果のステップ情報を全て保存する。

SavedRoute に以下を追加:
```
SavedRoute {
  id: string
  name: string
  waypoints: Waypoint[]
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
  roadType: RoadType               // 道路種別（高速/国道/県道/一般道）
  instruction: string              // 案内文（「国道254号を左折」等）
  distanceMeters: number
  durationSeconds: number
}
```

ナビ時はこの保存データから描画・案内を行い、Routes API は呼ばない。
これにより「決定したルートが変わらないナビゲーション」を実現する。

### 逸脱検知とリルート

ナビ中にGPS位置が保存ルートのポリラインから一定距離（閾値: 50m）離れたら逸脱と判定する。

逸脱検知時、ダイアログで以下の3選択肢を提示:

1. 逸脱地点に戻る
   - 未通過の直近ステップの開始地点に向かうルートを計算
   - ステップ通過管理により「まだ到達していないステップ」を特定する

2. 次の経由地までリルート（デフォルト — 一定時間選択なければ自動選択）
   - 現在地から次のウェイポイントまでRoutes APIでルート計算
   - 未通過ステップは未通過のまま保持（スキップ扱い）

3. 目的地までリルート
   - 現在地から残りの全ウェイポイント経由で目的地までRoutes API計算
   - 未通過ステップは未通過のまま保持

リルートで生成されたポリラインは、通常ルートとは異なるデザインで表示:
- リルートポリライン: グレー破線（#9ca3af）、太さ4、不透明度0.6
- 通過済みポリライン: 元の色で不透明度0.3に薄くする
- 未通過ポリライン: 元の色のまま

### ステップ通過管理

ステップの通過はnavigationStoreで管理する（保存データには含めない）。
通過判定はbooleanではなく、出口通過時のタイムスタンプと位置を記録する。

```
StepPassage {
  legIndex: number
  stepIndex: number
  exitTimestamp: string            // ISO 8601（出口通過時刻）
  exitPosition: LatLng             // 通過時の実GPS座標
}
```

活用方法:
- 区間ごとの実所要時間 = step[n+1].exitTimestamp - step[n].exitTimestamp
- 予定時間との比較（渋滞検知）
- 区間ごとの平均速度算出
- 同じルートの過去データとの比較

navigationStore に追加する状態:
```
currentLegIndex: number
currentStepIndex: number
stepPassages: StepPassage[]
isOffRoute: boolean
offRouteDistance: number            // ルートからの距離（メートル）
reroutePolyline: string | null     // リルート時の一時ポリライン
```

## GPSログ・走行記録仕様

### GPSログの記録方針

アプリ起動中は常にGPSログを記録する。
ナビ中と非ナビ中を区別して記録するが、
非ナビ中の記録をON/OFFする選択肢はUIに設けない（常に記録）。

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

TravelPoint {
  lat: number
  lng: number
  timestamp: string                // ISO 8601
  speed: number | null             // km/h
  heading: number | null           // 度
  accuracy: number | null          // GPS精度（メートル）
}
```

type の使い分け:
- navigation: ナビ開始で記録開始、ナビ終了で記録終了。routeId あり。
- tracking: 非ナビ中の走行記録。アプリ起動中に一定距離以上移動したら自動記録。routeId なし。

### GPS記録の間引き

記録時: GPS座標を全て rawPath に保持（生データ）。
保存時: Douglas-Peucker で間引いて simplifiedPath を生成。
  - tolerance = 0.00005（約5m）
  - 直線区間は大幅に間引かれる
  - カーブ区間は曲率に応じて密に残る
  - Google Earth での経路再現性を重視した閾値

間引きは保存時のみ実行し、生データは破棄しない。
後から閾値を変えて再間引き・再エクスポートが可能。

GPS記録の方針:
- watchPosition が返す全座標を rawPath に追加する
- ただし前回記録点から3m未満の場合は除外する（ヘアピンカーブのトレース精度を確保）
- ブラウザの watchPosition は呼び出し間隔を指定できないため、
  OS判断で約1〜3秒間隔の通知となる（フェーズ1の制約）
- フェーズ2（ネイティブアプリ）では1秒間隔の明示指定で精度を向上させる
- 停車中もGPSが通知する限り記録する（停車判定・タイムスタンプの連続性のため）
- 同一座標の連続（前回と完全一致）は除外する

## 走行記録画面

### 画面構成

TOP画面に「走行記録」タブを追加（ルート / ラベル / 場所 / 走行記録）。

走行記録画面:
- フィルタ方法:
  - ルートで選択: ルート一覧から選択 → そのルートに紐付く走行記録を表示
  - 日付で選択: カレンダーまたは日付範囲指定 → 該当日のログ一覧
  - 全て: 全ログ一覧（日付降順）

- ログ一覧: 複数選択可能（チェックボックス）
  - 各ログに日付、ルート名（あれば）、type（ナビ/トラッキング）、距離、時間を表示
  - 全選択 / 全解除ボタン

- 選択したログを地図に重ねて表示:
  - 各ログに異なる色を自動割り当て
  - 凡例表示

- アクション:
  - KMLエクスポート（選択中のログを1ファイルに）
  - 削除

### 走行記録の地図表示

選択されたログの simplifiedPath を Google Maps Polyline で描画する。
走行記録画面での表示は通常の Polyline で十分（同時に十数本程度の表示を想定）。

## ルート編集画面の表示レイヤー

### レイヤー切替パネル

ルート編集画面の地図上に表示レイヤー切替パネルを設ける。

```
表示オプション:
  ☑ 予定ルート（ポリライン）  ← OFF で予定ルートの線を非表示
  ☑ ウェイポイント（ピン）    ← OFF でピンを非表示
  ☐ 走行記録                ← ON で日付選択UIが展開
    ├── ☑ 2026-03-10
    ├── ☐ 2026-03-08
    └── 全選択 / 全解除
```

走行記録の表示デザイン:
- 各日付に異なる色を自動割り当て
- 半透明（opacity: 0.4）で予定ルートの下に表示
- 予定ルートやピンを非表示にして走行記録だけ見ることも可能

## KMLエクスポート仕様

### 出力構造

走行記録画面で選択したログをKMLファイルに出力する。

KMLファイルの構成:
```
Document
├── Folder: 予定ルート（該当ルートがあれば）
│   ├── Placemark: 道路種別ごとにポリライン（色分け）
│   └── Placemark: ウェイポイント（各地点のピン）
├── Folder: 実走ルート
│   ├── Placemark: 走行記録1（日付・ルート名）
│   ├── Placemark: 走行記録2
│   └── ...
└── Folder: ウェイポイント
    ├── Placemark: 各ウェイポイントのピン
    └── ...
```

KMLの色は AABBGGRR 形式（Google Earth の仕様）。
simplifiedPath の座標を LineString の coordinates に出力する。

## クモの巣走破地図仕様

### コンセプト

過去の全走行記録を日本地図に重ねて表示する。
走った道が色付きの線で塗られ、走っていない地域は白いまま。
「東北はまだ真っ白だな、次は東北に行こう」という使い方を想定。

### 性能要件

数十年分（1,500回以上、300万点以上）の走行データを
ブラウザおよびスマホで 60fps で軽快に描画すること。
Google Earth と同等以上の性能を実現する。

### アーキテクチャ

描画: deck.gl PathLayer + Google Maps Overlay
- WebGL（GPU並列処理）により数百万本の線分を1回のdraw callで描画
- Google Maps との公式統合（GoogleMapsOverlay）
- React 対応（@deck.gl/react）

データ構造: ズームレベル別LOD（Level of Detail）
- 低ズーム（日本全体）: tolerance 大 → 数万点に間引き
- 中ズーム（地方レベル）: tolerance 中 → 数十万点
- 高ズーム（市街地）: tolerance 小 → 全データ
- ズーム変更時に適切な解像度のデータセットに切替

タイル化:
- 表示範囲外のデータは読み込まない
- スクロール・ズームに応じて必要なタイルだけ動的読込
- 初期読込が数十年分のデータでも遅くならない

集約データの更新:
- 新しい走行記録が追加されるたびに増分更新
- 全データを再計算する必要はない

### 表示デザイン

- 走った道: インディゴ（#4f46e5, opacity: 0.6）
- 複数回走った道: 線が太く or 色が濃くなる（走行回数に応じて）
- 走っていない道: 何も描画されない（地図の白い部分）

### フィルタ

- 期間: 今月 / 今年 / 全期間 / カスタム範囲
- ルート別
- 将来的に: 車/バイク等のモード別

### 統計表示

- 総走行距離
- 都道府県走破率（走った道の距離の概算）

### 実装フェーズ

クモの巣走破地図はフェーズ2で実装する。
deck.gl + タイル化 + LOD の本格実装が必要なため。
フェーズ1では走行記録の保存とKMLエクスポートまでを実装する。

## 実装タイミング一覧

| 機能 | マイルストーン |
|------|-------------|
| routeSteps + legs の保存構造（型定義・StorageService） | 1-4 |
| ステップ通過タイムスタンプ（navigationStore） | 1-6 |
| ナビ中GPS記録（rawPath, simplifiedPath） | 1-6 |
| 非ナビ中GPS自動記録（tracking） | 1-6 |
| 逸脱検知 + リルートダイアログ（3選択肢） | 1-6 |
| 走行記録画面（一覧・複数選択・Polyline表示） | 1-6後追加 |
| ルート編集の表示レイヤー切替パネル | 1-6後追加 |
| KMLエクスポート | 1-6後追加 |
| クモの巣走破地図（deck.gl） | フェーズ2 |
| 都道府県走破率・統計 | フェーズ2 |
