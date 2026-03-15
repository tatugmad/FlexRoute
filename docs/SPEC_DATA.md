# FlexRoute データ仕様書

> 最終更新: 2026-03-14

## 型定義一覧

全型は `src/types/index.ts`、`src/types/route.ts`、`src/types/routesApi.ts` に集約。

### PlaceLabel

```ts
type PlaceLabel = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};
```

### LatLng

```ts
type LatLng = {
  lat: number;
  lng: number;
};
```

### PlaceData

```ts
type PlaceData = {
  address?: string;
  types?: string[];
  rating?: number;
  phoneNumber?: string;
  websiteUrl?: string;
  openingHours?: string[];
};
```

### Waypoint

```ts
type Waypoint = {
  id: string;
  position: LatLng;
  label: string;
  placeId: string | null;
  placeData?: PlaceData | null;
  userNote?: string;
  isCurrentLocation?: boolean;
};
```

### TravelMode

```ts
type TravelMode = "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT";
```

### RouteLeg

```ts
type RouteLeg = {
  startLocation: LatLng;
  endLocation: LatLng;
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
};
```

### Route

メモリ上のルート表現。routeStore.currentRoute の型。

```ts
type Route = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  legs: RouteLeg[];
  travelMode: TravelMode;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  createdAt: number;
  updatedAt: number;
};
```

### RoadType

```ts
type RoadType = "highway" | "national" | "prefectural" | "local";
```

### SavedRouteStep

```ts
type SavedRouteStep = {
  encodedPolyline: string;
  roadType: RoadType;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
};
```

### SavedRouteLeg

```ts
type SavedRouteLeg = {
  startWaypointIndex: number;
  endWaypointIndex: number;
  distanceMeters: number;
  durationSeconds: number;
  steps: SavedRouteStep[];
};
```

### SavedRoute

localStorage に永続化するルート構造。

```ts
type SavedRoute = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  travelMode: TravelMode;
  encodedPolyline: string;
  legs: SavedRouteLeg[];
  version: number;
  createdAt: string;
  updatedAt: string;
};
```

### NavigationStatus / NavigationState

```ts
type NavigationStatus = "idle" | "navigating" | "paused" | "arrived";

type NavigationState = {
  status: NavigationStatus;
  currentLegIndex: number;
  currentPosition: LatLng | null;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
};
```

### PositionQuality

```ts
type PositionQuality = 'active' | 'lost';
```

### PlaceResult

```ts
type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  position: LatLng;
  types: string[];
};
```

### PlaceModalData

```ts
type PlaceModalData = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  photoUrl: string | null;
  position: LatLng;
};
```

### UI 状態型

```ts
type ViewMode = "top" | "route";
type TopTab = "routes" | "labels" | "places";
type RouteViewMode = "tile" | "list";
type Panel = "route" | "search" | "navigation" | "settings";

type MapViewport = {
  center: LatLng;
  zoom: number;
};
```

### ログ関連型

```ts
type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  component?: string;
};

type UserAction = {
  timestamp: string;
  action: string;
  detail?: unknown;
};

type PerformanceMetric = {
  count: number;
  avg: number;
  min: number;
  max: number;
};
```

### Routes API v2 型（src/types/routesApi.ts）

```ts
type RoutesApiLatLng = {
  latitude: number;
  longitude: number;
};

type RoutesApiWaypoint = {
  location?: { latLng: RoutesApiLatLng };
  placeId?: string;
};

type ComputeRoutesRequest = {
  origin: RoutesApiWaypoint;
  destination: RoutesApiWaypoint;
  intermediates?: RoutesApiWaypoint[];
  travelMode: TravelMode;
  routingPreference?: "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL";
  computeAlternativeRoutes?: boolean;
};

type RoutesApiStep = {
  polyline: { encodedPolyline: string };
  navigationInstruction?: { instructions: string };
};

type ComputeRoutesResponse = {
  routes: Array<{
    legs: Array<{
      startLocation: { latLng: LatLng };
      endLocation: { latLng: LatLng };
      distanceMeters: number;
      duration: string;
      polyline: { encodedPolyline: string };
      steps: RoutesApiStep[];
    }>;
    distanceMeters: number;
    duration: string;
    polyline: { encodedPolyline: string };
  }>;
};
```

### 未定義型（1-6以降で追加予定）

以下の型は CLAUDE.md で設計済みだが、まだ `src/types/` には未定義:

- `GpsLog` — GPS走行記録
- `TravelPoint` — GPS座標点
- `StepPassage` — ステップ通過記録
- `SavedPlace` — 保存済み場所
- `SheetPosition` — ボトムシート位置
- `ModalType` — モーダル種別

## Zustand ストア構成

### routeStore（src/stores/routeStore.ts）

型定義: `src/stores/routeStoreTypes.ts`

#### 状態

| プロパティ | 型 | 初期値 | 説明 |
|---|---|---|---|
| currentRoute | `Route \| null` | `null` | 編集中のルート |
| savedRoutes | `SavedRoute[]` | `[]` | 保存済みルート一覧 |
| travelMode | `TravelMode` | `"DRIVE"` | 移動手段 |
| routeName | `string` | `""` | 入力中のルート名 |
| isCalculatingRoute | `boolean` | `false` | ルート計算中フラグ |
| routeError | `string \| null` | `null` | ルート計算エラー |
| routeSteps | `RoutesApiStep[]` | `[]` | Routes API から取得したステップ |
| encodedPolyline | `string \| null` | `null` | ルート全体のポリライン |
| currentLegs | `SavedRouteLeg[]` | `[]` | 変換済みの保存用leg |
| isDirty | `boolean` | `false` | 未保存の変更あり |

#### アクション

| アクション | 引数 | 説明 |
|---|---|---|
| setCurrentRoute | `(route: Route \| null)` | currentRoute を設定 |
| addWaypoint | `(waypoint: Waypoint, insertIndex?: number)` | ウェイポイント追加（位置指定可） |
| removeWaypoint | `(waypointId: string)` | ウェイポイント削除 |
| reorderWaypoints | `(waypoints: Waypoint[])` | ウェイポイント並び替え |
| setTravelMode | `(mode: TravelMode)` | 移動手段を設定 |
| setRouteName | `(name: string)` | ルート名を設定（isDirty = true） |
| setRouteData | `(data: { totalDistanceMeters, totalDurationSeconds, encodedPolyline, steps, legs })` | ルート計算結果を設定 |
| setRouteError | `(error: string \| null)` | エラーを設定 |
| setIsCalculatingRoute | `(isCalculating: boolean)` | 計算中フラグを設定 |
| setIsDirty | `(dirty: boolean)` | isDirty を設定 |
| clearRouteData | `()` | ルートデータをクリア |
| saveCurrentRoute | `()` | 現在ルートを localStorage に保存 |
| loadRoute | `(id: string)` | 保存済みルートを読み込み |
| deleteRoute | `(id: string)` | ルートを削除 |
| loadSavedRoutes | `()` | localStorage から全ルート読み込み |
| newRoute | `()` | 新規ルートを作成 |
| reset | `()` | 全状態を初期値に戻す |

### navigationStore（src/stores/navigationStore.ts）

#### 状態

| プロパティ | 型 | 初期値 | 説明 |
|---|---|---|---|
| status | `NavigationStatus` | `"idle"` | ナビ状態 |
| currentLegIndex | `number` | `0` | 現在のleg番号 |
| currentPosition | `LatLng \| null` | `null` | 現在地 |
| heading | `number` | `0` | 進行方向（度） |
| speed | `number` | `0` | 速度 |
| accuracy | `number \| null` | `null` | 位置精度（メートル） |
| positionQuality | `PositionQuality` | `"lost"` | 測位品質 |
| remainingDistanceMeters | `number` | `0` | 残り距離 |
| remainingDurationSeconds | `number` | `0` | 残り時間 |

#### アクション

| アクション | 引数 | 説明 |
|---|---|---|
| startNavigation | `()` | ナビ開始（status → navigating） |
| pauseNavigation | `()` | ナビ一時停止 |
| resumeNavigation | `()` | ナビ再開 |
| stopNavigation | `()` | ナビ終了（全状態初期化） |
| updatePosition | `(position: LatLng)` | 現在地更新 |
| setCurrentPosition | `(position: LatLng, heading: number, speed: number, quality: PositionQuality, accuracy: number \| null)` | 現在地・方向・速度・品質・精度を一括更新 |
| setCurrentLeg | `(index: number)` | 現在leg番号を設定 |
| setRemaining | `(distance: number, duration: number)` | 残り距離・時間を設定 |

### labelStore（src/stores/labelStore.ts）

#### 状態

| プロパティ | 型 | 初期値 | 説明 |
|---|---|---|---|
| labels | `PlaceLabel[]` | `[]` | ラベル一覧 |
| editingLabel | `PlaceLabel \| null` | `null` | 編集中のラベル |
| isLabelModalOpen | `boolean` | `false` | ラベルモーダル開閉 |

#### アクション

| アクション | 引数 | 説明 |
|---|---|---|
| loadLabels | `()` | localStorage から全ラベルを読み込み |
| addLabel | `(name: string, color: string)` | ラベルを追加 |
| updateLabel | `(id: string, updates: { name?: string; color?: string })` | ラベルを更新 |
| deleteLabel | `(id: string)` | ラベルを削除 |
| openLabelModal | `(label?: PlaceLabel)` | ラベルモーダルを開く（label指定で編集、省略で新規） |
| closeLabelModal | `()` | ラベルモーダルを閉じる |

### placeStore（src/stores/placeStore.ts）

#### 状態

| プロパティ | 型 | 初期値 | 説明 |
|---|---|---|---|
| query | `string` | `""` | 検索クエリ |
| results | `PlaceResult[]` | `[]` | 検索結果 |
| selectedPlace | `PlaceResult \| null` | `null` | 選択中の場所 |
| isSearching | `boolean` | `false` | 検索中フラグ |
| placeModalData | `PlaceModalData \| null` | `null` | PlaceActionModal の表示データ |
| placeModalOpen | `boolean` | `false` | PlaceActionModal の開閉 |

#### アクション

| アクション | 引数 | 説明 |
|---|---|---|
| setQuery | `(query: string)` | 検索クエリを設定 |
| setResults | `(results: PlaceResult[])` | 検索結果を設定 |
| setSelectedPlace | `(place: PlaceResult \| null)` | 選択場所を設定 |
| setIsSearching | `(isSearching: boolean)` | 検索中フラグを設定 |
| openPlaceModal | `(data: PlaceModalData)` | PlaceActionModal を開く |
| closePlaceModal | `()` | PlaceActionModal を閉じる |
| reset | `()` | 全状態を初期値に戻す |

### uiStore（src/stores/uiStore.ts）

#### 状態

| プロパティ | 型 | 初期値 | 説明 |
|---|---|---|---|
| viewMode | `ViewMode` | `"top"` | 画面モード |
| activePanel | `Panel` | `"route"` | アクティブパネル |
| isSidebarOpen | `boolean` | `true` | サイドバー開閉 |
| viewport | `MapViewport` | `{ center: { lat: 35.6812, lng: 139.7671 }, zoom: 14 }` | 地図の表示範囲 |
| isLoading | `boolean` | `false` | ローディング中 |
| isMapReady | `boolean` | `false` | 地図初期化完了 |
| error | `string \| null` | `null` | エラーメッセージ |
| topTab | `TopTab` | `"routes"` | TOP画面タブ |
| routeViewMode | `RouteViewMode` | `"tile"` | ルート一覧の表示形式 |
| labelViewMode | `RouteViewMode` | `"tile"` | ラベル一覧の表示形式 |
| placesViewMode | `RouteViewMode` | `"tile"` | 場所一覧の表示形式 |
| searchModalOpen | `boolean` | `false` | 検索モーダル開閉 |
| insertIndex | `number \| null` | `null` | 挿入位置（検索モーダル用） |
| confirmDialog | `ConfirmDialog` | `{ isOpen: false, message: "", onConfirm: null }` | 確認ダイアログ |

ConfirmDialog の型:
```ts
type ConfirmDialog = {
  isOpen: boolean;
  message: string;
  onConfirm: (() => void) | null;
};
```

#### アクション

| アクション | 引数 | 説明 |
|---|---|---|
| setViewMode | `(mode: ViewMode)` | 画面モードを設定 |
| setActivePanel | `(panel: Panel)` | アクティブパネルを設定 |
| toggleSidebar | `()` | サイドバー開閉切替 |
| setSidebarOpen | `(open: boolean)` | サイドバー開閉を設定 |
| setViewport | `(viewport: MapViewport)` | 地図表示範囲を設定 |
| setIsLoading | `(isLoading: boolean)` | ローディングを設定 |
| setMapReady | `(ready: boolean)` | 地図初期化完了を設定 |
| setError | `(error: string \| null)` | エラーを設定 |
| setTopTab | `(tab: TopTab)` | TOP画面タブを設定 |
| setRouteViewMode | `(mode: RouteViewMode)` | ルート一覧表示形式を設定 |
| setLabelViewMode | `(mode: RouteViewMode)` | ラベル一覧表示形式を設定 |
| setPlacesViewMode | `(mode: RouteViewMode)` | 場所一覧表示形式を設定 |
| setSearchModalOpen | `(open: boolean)` | 検索モーダル開閉を設定 |
| setInsertIndex | `(index: number \| null)` | 挿入位置を設定 |
| openConfirmDialog | `(message: string, onConfirm: () => void)` | 確認ダイアログを開く |
| closeConfirmDialog | `()` | 確認ダイアログを閉じる |

## データ永続化

### フェーズ1: localStorage

#### StorageService インターフェース（src/services/storage.ts）

```ts
type StorageService = {
  getRoutes: () => SavedRoute[];
  saveRoute: (route: SavedRoute) => void;
  deleteRoute: (routeId: string) => void;
  getRoute: (routeId: string) => SavedRoute | undefined;
};
```

#### localStorage キー設計

| キー | 値 | 説明 |
|---|---|---|
| `flexroute:routes` | `SavedRoute[]` のJSON文字列 | 全ルートを1キーに集約 |
| `flexroute:labels` | `PlaceLabel[]` のJSON文字列 | 全ラベルを1キーに集約 |
| `flexroute:lastKnownPosition` | `{ lat, lng, updatedAt }` のJSON文字列 | ナビ終了時の最終位置 |

実装: `localStorageService`（src/services/storage.ts）
- `readAll()`: localStorage から読み取り、JSON.parse。エラー時は空配列
- `writeAll(routes)`: JSON.stringify して localStorage に書き込み
- `saveRoute()`: 既存ID一致なら上書き、なければ追加
- `deleteRoute()`: ID一致を除外して書き込み

### フェーズ2: PostgreSQL + PostGIS

テーブル設計方針:
- テーブル名: 複数形スネークケース（saved_routes）
- 外部キー: 参照先主キー名と一致（user_id）
- 全テーブルに version カラム
- BEFORE UPDATE トリガーで更新前データを *_history テーブルに退避
- ウェイポイント・legs・steps はルートのJSONBカラムに集約（正規化しない）
  - 理由: スナップショット単位のバージョン管理のため
- 1操作 = 1 API呼び出し（Atomic API）
- べき等性キー（X-Idempotency-Key）を全更新APIに付与

## Google Routes API v2 連携

### エンドポイント

```
POST https://routes.googleapis.com/directions/v2:computeRoutes
```

### ヘッダー

```
Content-Type: application/json
X-Goog-Api-Key: {API_KEY}
X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.polyline.encodedPolyline,routes.legs.steps.navigationInstruction.instructions
```

### リクエストボディ

```json
{
  "origin": { "location": { "latLng": { "latitude": number, "longitude": number } } },
  "destination": { "location": { "latLng": { "latitude": number, "longitude": number } } },
  "intermediates": [
    { "location": { "latLng": { "latitude": number, "longitude": number } } }
  ],
  "travelMode": "DRIVE",
  "routingPreference": "TRAFFIC_AWARE",
  "computeAlternativeRoutes": false,
  "routeModifiers": {
    "avoidTolls": false,
    "avoidHighways": false,
    "avoidFerries": false
  },
  "languageCode": "ja-JP"
}
```

**注意**: Google Routes API v2 は `{ latitude, longitude }` 形式。
`{ lat, lng }` 形式ではない。この変換ミスで400エラーが発生した前例あり。

### レスポンス処理

- `routes[0].duration` → `"XXXs"` 形式の文字列 → `parseInt` で秒数に変換
- `routes[0].distanceMeters` → number（メートル）
- `routes[0].polyline.encodedPolyline` → ルート全体のポリライン文字列
- `routes[0].legs[]` → ウェイポイント間の区間
- `routes[0].legs[].steps[]` → 各ステップ
  - `step.polyline.encodedPolyline` → ステップのポリライン
  - `step.navigationInstruction.instructions` → 案内文（道路種別判定に使用）

### 道路種別判定（classifyRoadType）

案内文に以下を含むかで判定:

| キーワード | RoadType | ポリライン色 |
|---|---|---|
| 「高速」「有料」「自動車道」「IC」「JCT」 | highway | #ec4899（ピンク） |
| 「国道」 | national | #eab308（黄色） |
| 「県道」「都道」「府道」「道道」 | prefectural | #22c55e（緑） |
| 上記以外 | local | #4f46e5（インディゴ） |

## Google Places API 連携

### 使用API

- **Places Autocomplete API** — 検索モーダルでの場所検索
- **Place Details** — Placeアイコンタップ時のPlace名取得

### APIProvider 設定

```tsx
<APIProvider apiKey={API_KEY} libraries={["places", "geometry"]}>
```

## 自動保存ポリシー

### 保存タイミング

即座に保存:
- ウェイポイント追加・削除・並び替え
- ルート計算完了（legs/encodedPolyline更新）

フォーカスアウト時に保存:
- ルート名入力欄の blur イベント
- 画面遷移時にフォーカス中の入力欄の blur を先に発火

### 保存条件

- ウェイポイント1件以上 OR ルート名がtrim()で空でない → 保存
- 両方とも空 → 保存スキップ（Storage上のデータを上書きしない）

### 使用しないもの

- debounce タイマー
- beforeunload イベント
- F5でテキスト入力中の数文字が失われることは許容

### TOP画面に戻る時

- 新規 + 条件不成立 → 破棄
- 既存 + 条件不成立 → 上書きしていないので以前の状態が残る
- 条件成立 → 保存して戻る

## 環境変数

| 変数名 | 説明 |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Platform API Key |
| `VITE_GOOGLE_MAPS_MAP_ID` | Cloud-based Map ID（AdvancedMarker用、未設定なら `"DEMO_MAP_ID"`） |

### Google Cloud Console で有効にすべきAPI

- Maps JavaScript API
- Routes API
- Places API
- Places API (New)
- Geocoding API

## デプロイ構成

### GitHub Pages + GitHub Actions
- デプロイ先: https://tatugmad.github.io/FlexRoute/
- トリガー: main ブランチへの push
- ワークフロー: .github/workflows/deploy.yml
- ビルド: Node.js 20, npm ci, npm run build
- 環境変数: GitHub Secrets から VITE_GOOGLE_MAPS_API_KEY を注入
- デプロイ: actions/deploy-pages
- vite.config.ts の base: '/FlexRoute/'（GitHub Pages のサブパス対応）
- リポジトリは Public（GitHub Pages の無料利用のため。API Key は Secrets に保管で安全）

### ビルド設定
- Source Map: build.sourcemap: true（本番でもブラウザDevToolsでデバッグ可能）
- ファイル名ハッシュ: entryFileNames, chunkFileNames, assetFileNames に [hash] パターン（キャッシュ対策）
- index.html にキャッシュ防止 meta タグ設定済み

## ウェイポイントバリデーション

routeStore の addWaypoint で以下のバリデーションを実行:
- isValidPosition() ヘルパーで検証
- NaN の座標を拒否
- Infinity の座標を拒否
- (0, 0) の座標を拒否（ギニア湾の海上であり有効な目的地ではない）
- placeId が空文字列の場合は null に変換
- placeId が undefined の場合は null に変換
- placeId は必ず string | null のいずれか（undefined を許さない）

useRouteCalculation でもルート計算前にフィルタ:
- Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
- 無効なウェイポイントが1つでもあればルート計算を実行しない

## Hooks 責務一覧

### useGeolocation（src/hooks/useGeolocation.ts）

- **責務**: GPS位置を watchPosition で継続監視し、現在地・方向・速度をstoreに反映する
- **依存store**: navigationStore（setCurrentPosition）
- **依存service**: geolocation（watchHighAccuracy, clearPositionWatch）、logService
- **呼び出し元**: ナビ画面（1-6 で実装予定。現在はどこからも呼ばれていない）

### useRouteCalculation（src/hooks/useRouteCalculation.ts）

- **責務**: ウェイポイント変更を検知し、Routes API v2 でルートを自動計算する。レスポンスからlegs/stepsを解析し道路種別を判定してstoreに反映
- **依存store**: routeStore（currentRoute.waypoints, travelMode, setRouteData, setRouteError, setIsCalculatingRoute）
- **依存service**: routeApi（computeRoutes）、logService
- **依存utils**: roadType（classifyRoadType）
- **呼び出し元**: RoutePolyline.tsx

### useMapClickHandler（src/hooks/useMapClickHandler.ts）

- **責務**: 地図タップ時にウェイポイントを追加する。Placeアイコンタップ（経路A）と地図面タップ（経路B）を分離し、経路AではPlaces APIでPlace名を取得、経路Bでは座標のみでウェイポイントを作成する
- **依存store**: routeStore（addWaypoint）、uiStore（viewMode）
- **依存service**: userActionTracker
- **呼び出し元**: App.tsx

### useMapInitialView（src/hooks/useMapInitialView.ts）

- **責務**: 地図の初期表示を制御する。ウェイポイントなし時は lastKnownPosition（localStorage）で初期位置を決定、ウェイポイント1件時はそのポイントに、2件以上時はfitBoundsで全WPが収まる範囲に表示
- **依存store**: routeStore（currentRoute）、uiStore（setMapReady）
- **依存service**: geolocation（getLastKnownPosition）
- **呼び出し元**: MapInitialView.tsx

### useAutoSave（src/hooks/useAutoSave.ts）

- **責務**: ウェイポイント・ポリライン・legsの変更を検知し、保存条件（WP1件以上 or ルート名非空）を満たす場合に自動保存する。初回マウント時は保存をスキップ
- **依存store**: routeStore（currentRoute.waypoints, encodedPolyline, currentLegs, isDirty, saveCurrentRoute）
- **依存service**: なし（routeStore経由で間接的にlocalStorageServiceを使用）
- **公開関数**: canSaveRoute(waypointCount, routeName) — 保存条件の判定ヘルパー
- **呼び出し元**: RouteEditor.tsx

### useNewRoute（src/hooks/useNewRoute.ts）

- **責務**: 新規ルート作成のコールバックを返す。routeStore.newRoute() をuseCallbackでメモ化
- **依存store**: routeStore（newRoute）
- **依存service**: なし
- **呼び出し元**: RouteList.tsx

## Services 責務一覧

### storage.ts（src/services/storage.ts）

- **責務**: ルートデータの永続化インターフェース定義と localStorage 実装。フェーズ2でPostgreSQL実装に差し替え可能な設計
- **公開関数/型**:
  - `StorageService`（型）— getRoutes, saveRoute, deleteRoute, getRoute の4メソッドインターフェース
  - `localStorageService`（インスタンス）— StorageService の localStorage 実装
    - `getRoutes()` — localStorage から全ルートを読み込み（JSON.parse）
    - `saveRoute(route)` — ルートを保存（既存IDは上書き、新規は追加）
    - `deleteRoute(routeId)` — ルートを削除
    - `getRoute(routeId)` — IDでルートを1件取得

### routeApi.ts（src/services/routeApi.ts）

- **責務**: Google Routes API v2 の呼び出しをラップ。リクエスト構築・ヘッダー設定・レスポンス取得を行う
- **公開関数**:
  - `computeRoutes(request)` — Routes API v2 にPOSTリクエストを送信し ComputeRoutesResponse を返す。パフォーマンス計測・ログ出力を含む

### geolocation.ts（src/services/geolocation.ts）

- **責務**: Geolocation API のラッパーと lastKnownPosition の永続化。ナビ画面で使用
- **公開関数/型**:
  - `GeolocationResult`（型）— lat, lng, heading, speed, accuracy を持つ位置情報
  - `GeolocationErrorInfo`（型）— code, message を持つエラー情報
  - `watchHighAccuracy(onSuccess, onError)` — enableHighAccuracy: true で watchPosition を開始し watchId を返す
  - `clearPositionWatch(watchId)` — watchPosition を停止
  - `saveLastKnownPosition(lat, lng)` — 現在位置を localStorage に保存（ナビ終了時に呼ぶ）
  - `getLastKnownPosition()` — localStorage から最後の位置を読み込み。null の場合あり

### labelStorage.ts（src/services/labelStorage.ts）

- **責務**: ラベルデータの localStorage 永続化
- **公開関数**:
  - `labelStorageService.getLabels()` — 全ラベルを読み込み
  - `labelStorageService.saveLabel(label)` — ラベルを保存（既存IDは上書き、新規は追加）
  - `labelStorageService.deleteLabel(labelId)` — ラベルを削除
  - `labelStorageService.getLabel(labelId)` — IDでラベルを1件取得

### logService.ts（src/services/logService.ts）

- **責務**: アプリケーション統合ログ基盤。カテゴリ別・レベル別のログ記録とリングバッファによるメモリ保持。開発時はコンソール出力、本番はwarn/errorのみ保持
- **公開関数**:
  - `logService.debug(category, message, data?)` — デバッグログ（本番では破棄）
  - `logService.info(category, message, data?)` — 情報ログ（本番では破棄）
  - `logService.warn(category, message, data?)` — 警告ログ（常に保持）
  - `logService.error(category, message, data?)` — エラーログ（常に保持）
  - `logService.getRecentLogs(count)` — 直近のログを取得（デフォルト50件）
  - `logService.exportLogs()` — 全ログをJSON文字列で出力
  - `logService.clear()` — ログをクリア
  - `logService.send(entries)` — 外部ログサービスへの送信スタブ（フェーズ2用）
- **内部クラス**: RingBuffer — 最大500件のリングバッファ

### userActionTracker.ts（src/services/userActionTracker.ts）

- **責務**: ユーザー操作（地図タップ、ウェイポイント追加/削除等）の追跡記録。最大200件をリングバッファで保持し、logServiceにも転送
- **公開関数**:
  - `userActionTracker.track(action, detail?)` — 操作を記録（例: "ADD_WAYPOINT", "MAP_CLICK_PLACE_ADD_WAYPOINT"）
  - `userActionTracker.getRecentActions(count)` — 直近の操作を取得（デフォルト50件）
  - `userActionTracker.exportActions()` — 全操作をJSON文字列で出力

### performanceMonitor.ts（src/services/performanceMonitor.ts）

- **責務**: API呼び出し等のパフォーマンス計測。タイマー制御と統計情報（平均/最小/最大/回数）を管理。5秒超の操作をwarnレベルで記録
- **公開関数**:
  - `performanceMonitor.startTimer(label)` — 計測開始
  - `performanceMonitor.endTimer(label)` — 計測終了し経過時間を返す。閾値超えはwarn出力
  - `performanceMonitor.getMetrics()` — 全計測ラベルの統計情報（count, avg, min, max）を返す

## Utils 責務一覧

### formatters.ts（src/utils/formatters.ts）

- **責務**: 距離・時間の表示用フォーマット
- **公開関数**:
  - `formatDuration(seconds)` — 秒数を「X時間XX分」or「XX分」に変換
  - `formatDistance(meters)` — メートルを「X.Xkm」or「XXXm」に変換

### roadType.ts（src/utils/roadType.ts）

- **責務**: ナビゲーション案内文から道路種別を判定し、対応するポリライン色を返す
- **公開関数**:
  - `classifyRoadType(instruction)` — 案内文のキーワードから RoadType を判定（highway/national/prefectural/local）
  - `getRoadColor(roadType)` — RoadType に対応するポリライン色（hex）を返す
- **定数**:
  - `HIGHWAY_KEYWORDS` — ["高速", "有料", "自動車道", "IC", "JCT"]
  - `NATIONAL_KEYWORDS` — ["国道"]
  - `PREFECTURAL_KEYWORDS` — ["県道", "都道", "府道", "道道"]
  - `ROAD_COLORS` — { highway: "#ec4899", national: "#eab308", prefectural: "#22c55e", local: "#4f46e5" }

## Constants

### src/constants/

現時点では `.gitkeep` のみ存在し、定数ファイルは未作成。
各定数はそれぞれのファイル内にローカル定義されている:

| 定数 | 定義場所 | 値 |
|------|---------|-----|
| `STORAGE_KEY` | services/storage.ts | `"flexroute:routes"` |
| `MAX_ENTRIES` | services/logService.ts | `500` |
| `MAX_ACTIONS` | services/userActionTracker.ts | `200` |
| `SLOW_THRESHOLD_MS` | services/performanceMonitor.ts | `5000` |
| `ROUTES_API_URL` | services/routeApi.ts | `"https://routes.googleapis.com/directions/v2:computeRoutes"` |
| `FIELD_MASK` | services/routeApi.ts | routes.duration, distanceMeters, polyline 等のフィールドマスク |
| `HIGH_ACCURACY_OPTIONS` | services/geolocation.ts | `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }` |
| `LAST_KNOWN_POSITION_KEY` | services/geolocation.ts | `"flexroute:lastKnownPosition"` |
| `LOST_THRESHOLD` | hooks/useGeolocation.ts | `15000` |
| `CHECK_INTERVAL` | hooks/useGeolocation.ts | `1000` |
| `STORAGE_KEY`（ラベル） | services/labelStorage.ts | `"flexroute:labels"` |
| `DEFAULT_ZOOM` | hooks/useMapInitialView.ts | `15` |
| `DEFAULT_CENTER` | hooks/useMapInitialView.ts | `{ lat: 35.6895, lng: 139.6917 }`（東京） |
| `FIT_BOUNDS_PADDING` | hooks/useMapInitialView.ts | `80` |
| `HIGHWAY_KEYWORDS` | utils/roadType.ts | `["高速", "有料", "自動車道", "IC", "JCT"]` |
| `NATIONAL_KEYWORDS` | utils/roadType.ts | `["国道"]` |
| `PREFECTURAL_KEYWORDS` | utils/roadType.ts | `["県道", "都道", "府道", "道道"]` |
| `ROAD_COLORS` | utils/roadType.ts | highway=#ec4899, national=#eab308, prefectural=#22c55e, local=#4f46e5 |
| `CONSOLE_STYLES` | services/logService.ts | debug=#9ca3af, info=#3b82f6, warn=#eab308, error=#ef4444 |

## フォーマットユーティリティ

### formatDuration(seconds)

- 1時間未満 → 「XX分」
- 1時間以上 → 「X時間XX分」

### formatDistance(meters)

- 1km未満 → 「XXXm」
- 1km以上 → 「X.Xkm」
