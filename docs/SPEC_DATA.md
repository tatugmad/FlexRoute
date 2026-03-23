# FlexRoute データ仕様書

> 最終更新: 2026-03-23

## 型定義一覧

全型は `src/types/index.ts`、`src/types/route.ts`、`src/types/routesApi.ts` に集約。

### Label

```ts
type Label = {
  id: string;
  name: string;
  color: string;
  forRoute: boolean;
  forPlace: boolean;
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
  mapCenter: LatLng | null;
  mapZoom: number | null;
  mapWidth: number | null;
  mapHeight: number | null;
  thumbnailUrl: string | null;
  thumbnailUrlSmall: string | null;
  labelIds: string[];
};
```

### StepPassage

ステップ通過記録。navigationStore で管理（永続化しない）。

```ts
type StepPassage = {
  legIndex: number;
  stepIndex: number;
  exitTimestamp: string;      // ISO 8601（出口通過時刻）
  exitPosition: LatLng;       // 通過時の実GPS座標
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
type PositionQuality = 'active' | 'lost' | 'denied';
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
type ViewMode = "top" | "route" | "navigation";
type TopTab = "routes" | "labels" | "places";
type RouteViewMode = "tile" | "list";
type RouteSortKey = "updatedAt" | "createdAt" | "name" | "distance";
type Panel = "route" | "search" | "navigation" | "settings";

type MapViewport = {
  center: LatLng;
  zoom: number;
};

type FollowMode = 'auto' | 'free';
type ZoomMode = 'autoZoom' | 'lockedZoom';
type HeadingMode = 'headingUp' | 'northUp';
```

### センサー型（src/types/sensor.ts）

```ts
type SensorMode = 'real' | 'sim';
type PositionCallbackMode = 'sync' | 'interval' | 'lost';

type SensorChannelModes = {
  position: SensorMode;
  heading: SensorMode;
  speed: SensorMode;
  magneticHeading: SensorMode;
  network: SensorMode;
  battery: SensorMode;
  screenOrientation: SensorMode;
  wakeLock: SensorMode;
  visibility: SensorMode;
  deviceMotion: SensorMode;
  vibration: SensorMode;
  ambientLight: SensorMode;
};

type SimValues = {
  position: { lat: number; lng: number } | null;
  heading: number;
  speed: number;
  accuracy: number;
  callbackIntervalMs: number;
  denied: boolean;
  positionCallbackMode: PositionCallbackMode;
  headingSync: boolean;
  speedSync: boolean;
};
```

### ログ関連型（F-LOG v2）

ログ関連の型は `src/types/log.ts` に定義。

```ts
/** ログレベル */
const LOG_LEVELS = {
  trace: 0, debug: 1, info: 2, warn: 3, error: 4,
} as const;
type LogLevelName = keyof typeof LOG_LEVELS;

/** ログカテゴリ */
const LOG_CATEGORIES = {
  NAV: 0, GPS: 1, SIM: 2, SNAP: 3, ROUTE: 4,
  STORAGE: 5, LABEL_STORE: 6, LABEL_STORAGE: 7,
  PLACE_STORE: 8, PLACE_STORAGE: 9, PLACE_DETAILS: 10,
  API: 11, UI: 12, PERF: 13, USER_ACTION: 14, ERROR: 15,
} as const;
type LogCategoryName = keyof typeof LOG_CATEGORIES;

/** FlightRecorder の1エントリ（構造化データのみ、文字列なし） */
type FlightRecorderEntry = {
  t: number;           // performance.now() タイムスタンプ
  level: number;       // LogLevel 数値
  cat: number;         // LogCategory 数値
  tag: string;         // イベントタグ（例: "gps.position"）
  data?: unknown;      // 構造化データ
};

/** dump 時のフォーマット済みエントリ */
type FormattedLogEntry = {
  timestamp: string;   // ISO 8601
  level: LogLevelName;
  category: LogCategoryName;
  tag: string;
  data?: unknown;
};
```

注: 旧型（LogLevel, LogEntry, UserAction, PerformanceMetric）は
v1.6.49 で旧サービスとともに削除済み。

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

### SavedPlace

```ts
type SavedPlace = {
  id: string;
  placeId: string;
  name: string;
  originalName: string | null;
  address: string;
  position: LatLng;
  rating: number | null;
  photoUrl: string | null;
  labelIds: string[];
  memo: string;
  createdAt: string;
  updatedAt: string;
};
```

### 未定義型（1-6以降で追加予定）

以下の型は CLAUDE.md で設計済みだが、まだ `src/types/` には未定義:

- `GpsLog` — GPS走行記録
- `TravelPoint` — GPS座標点
- `StepPassage` — ステップ通過記録
- `SheetPosition` — ボトムシート位置
- `ModalType` — モーダル種別

## Zustand ストア構成

### routeStore（src/stores/routeStore.ts）

型定義: `src/stores/routeStoreTypes.ts`
永続化アクション実装: `src/stores/routeStorePersistence.ts`

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
| currentLabelIds | `string[]` | `[]` | 編集中ルートのラベルID一覧 |

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
| setCurrentLabelIds | `(labelIds: string[])` | ルートのラベルIDを設定（isDirty = true） |
| reset | `()` | 全状態を初期値に戻す |

### routeConverters.ts（src/stores/routeConverters.ts）

- **責務**: Route ↔ SavedRoute の変換と新規ルート生成
- **公開関数**:
  - `toSavedRoute(currentRoute, routeName, encodedPolyline, currentLegs, savedRoutes, mapCenter, mapZoom, mapWidth, mapHeight, currentLabelIds)` — 編集中ルートを保存形式に変換
  - `migrateLabelIds(routes)` — labelIds 未設定の古いデータを [] にマイグレーション
  - `createNewRoute(travelMode)` — 新規空ルートを生成
  - `toRoute(saved)` — 保存形式から編集形式に変換

### routeStorePersistence.ts（src/stores/routeStorePersistence.ts）

- **責務**: routeStore の永続化アクション。localStorage への保存・読込・削除・一覧取得
- **公開関数**:
  - `saveCurrentRoute(get, set)` — 現在ルートをサムネイル生成込みで localStorage に保存
  - `loadRoute(get, set, id)` — 保存済みルートを読み込み、currentRoute に設定
  - `deleteRoute(get, set, id)` — ルートを localStorage から削除
  - `loadSavedRoutes(get, set)` — localStorage から全ルート読み込み。サムネイル・labelIds のマイグレーション含む
- **呼び出し元**: routeStore.ts（Zustand の get/set を渡して委譲）
- **依存**: localStorageService, routeConverters, routeThumbnail, thumbnailUrl, flightRecorder

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
| lostSince | `string \| null` | `null` | lost 状態になった時刻（ISO 8601） |
| followMode | `FollowMode` | `"auto"` | 追従モード |
| zoomMode | `ZoomMode` | `"autoZoom"` | ズーム制御モード |
| headingMode | `HeadingMode` | `"northUp"` | ヘッディング制御モード |
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
| setFollowMode | `(mode: FollowMode)` | 追従モードを設定 |
| setZoomMode | `(mode: ZoomMode)` | ズーム制御モードを設定 |
| setHeadingMode | `(mode: HeadingMode)` | ヘッディング制御モードを設定 |

### sensorStore（src/stores/sensorStore.ts）

#### 状態

| プロパティ | 型 | 初期値 | 説明 |
|---|---|---|---|
| debugEnabled | `boolean` | URLに?debugがあればtrue | デバッグモード |
| channelModes | `SensorChannelModes` | 全チャンネル 'real' | チャンネル別 real/sim モード |
| simValues | `SimValues` | position=null, heading=0, speed=0, accuracy=10, callbackIntervalMs=1000, denied=false, positionCallbackMode='sync', headingSync=true, speedSync=true | sim モード時の値 |

#### アクション

| アクション | 引数 | 説明 |
|---|---|---|
| setChannelMode | `(channel, mode, initialPosition?)` | チャンネルのモードを切替。position+sim時はinitialPositionで初期座標をatomic設定 |
| setSimPosition | `(lat, lng)` | sim 座標を設定 |
| setSimHeading | `(heading)` | sim heading を設定 |
| setSimSpeed | `(speed)` | sim speed を設定 |
| setSimAccuracy | `(accuracy)` | sim accuracy を設定 |
| setSimCallbackInterval | `(ms)` | callback 発火間隔を設定 |
| setSimDenied | `(denied)` | denied 状態を設定 |
| setPositionCallbackMode | `(mode)` | callback モード（sync/interval/lost）を設定 |
| setHeadingSync | `(sync)` | heading の sync ON/OFF を設定 |
| setSpeedSync | `(sync)` | speed の sync ON/OFF を設定 |
| setDebugEnabled | `(enabled)` | デバッグモードを設定 |
| resetAllToReal | `()` | 全チャンネルを real に戻す |

### labelStore（src/stores/labelStore.ts）

#### 状態

| プロパティ | 型 | 初期値 | 説明 |
|---|---|---|---|
| labels | `Label[]` | `[]` | ラベル一覧 |
| editingLabel | `Label \| null` | `null` | 編集中のラベル |
| isLabelModalOpen | `boolean` | `false` | ラベルモーダル開閉 |

#### アクション

| アクション | 引数 | 説明 |
|---|---|---|
| loadLabels | `()` | localStorage から全ラベルを読み込み |
| addLabel | `(name: string, color: string, forRoute: boolean, forPlace: boolean)` | ラベルを追加 |
| updateLabel | `(id: string, updates: { name?: string; color?: string; forRoute?: boolean; forPlace?: boolean })` | ラベルを更新 |
| deleteLabel | `(id: string)` | ラベルを削除 |
| openLabelModal | `(label?: Label)` | ラベルモーダルを開く（label指定で編集、省略で新規） |
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
| savedPlaces | `SavedPlace[]` | `[]` | 保存済み場所一覧 |
| detailPlaceId | `string \| null` | `null` | PlaceDetailModal に表示中の場所ID |

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
| loadPlaces | `()` | localStorage から全場所を読み込み |
| savePlace | `(place: Omit<SavedPlace, "id" \| "createdAt" \| "updatedAt">)` | 場所を保存（id/timestamps自動生成） |
| updatePlace | `(id: string, updates: Partial<Pick<SavedPlace, "name" \| "memo" \| "labelIds" \| "photoUrl" \| "originalName">>)` | 場所を更新 |
| deletePlace | `(id: string)` | 場所を削除 |
| isSaved | `(googlePlaceId: string)` | 指定placeIdの場所が保存済みか判定 |
| openPlaceDetail | `(id: string)` | PlaceDetailModal を開く |
| closePlaceDetail | `()` | PlaceDetailModal を閉じる |

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
| routeSortKey | `RouteSortKey` | `"updatedAt"` | ルート一覧の並び順 |
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
| setRouteSortKey | `(key: RouteSortKey)` | ルート一覧の並び順を設定 |
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
| `flexroute:labels` | `Label[]` のJSON文字列 | 全ラベルを1キーに集約 |
| `flexroute:places` | `SavedPlace[]` のJSON文字列 | 全保存済み場所を1キーに集約 |
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
| `VITE_GOOGLE_MAPS_MAP_ID` | Cloud-based Map ID（ベクターマップ + AdvancedMarker用）。FlexRoute 管理。ユーザー設定不要。未設定なら `"DEMO_MAP_ID"` にフォールバック |

### Google Cloud Console で有効にすべきAPI

- Maps JavaScript API
- Routes API
- Places API
- Places API (New)
- Maps Static API

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

### useNavGeolocation（src/hooks/useNavGeolocation.ts）

- **責務**: ナビゲーション画面でGPS位置を watchPosition で継続監視する。sim の存在を知らない純粋なPGコード（D-029）。denied 状態の5秒リトライ、ナビ終了時の lastKnownPosition 保存を含む
- **依存store**: navigationStore（setCurrentPosition）
- **依存hooks**: useLostTimer
- **呼び出し元**: NavigationScreen.tsx

### useLostTimer（src/hooks/useLostTimer.ts）

- **責務**: 適応的 lost 閾値（D-028）のタイマー管理。直近10回の更新間隔から中央値を算出し、lost 判定閾値を動的に決定する
- **依存store**: navigationStore（setState で positionQuality, lostSince を直接更新）
- **公開関数**: setLost, setActive, resetLostTimer, recordInterval, clearLostTimer, resetIntervals
- **呼び出し元**: useNavGeolocation

### useRouteSnap（src/hooks/useRouteSnap.ts）

- **責務**: GPS座標をルートポリラインの最近点にスナップする（D-027）。逸脱判定閾値50m超の場合はスナップしない（null を返す）
- **依存store**: routeStore（currentLegs）
- **依存API**: google.maps.geometry（spherical, encoding）
- **引数**: position: LatLng | null
- **戻り値**: LatLng | null（スナップ後の座標、またはスナップ不要時はnull）
- **呼び出し元**: CurrentLocationMarker.tsx（navigation/）

### useHeadingFusion（src/hooks/useHeadingFusion.ts）

- **責務**: GPS heading と磁気 heading を融合する抽象化レイヤー（D-031）。現在はスケルトン（何もしない）
- **依存store**: なし
- **呼び出し元**: なし（将来 NavigationScreen で使用予定）
- **ステータス**: スケルトンのみ。sensor.ts に型定義あり

### useStepProgression（src/hooks/useStepProgression.ts）

- **責務**: ステップ通過判定。legs/steps のポリラインを平坦化したセグメント配列を構築し、GPS位置更新ごとに最近接セグメントを特定してステップ進行を管理する。逸脱距離の計算、残距離・残時間の算出、次の案内文の更新を含む
- **依存store**: navigationStore（currentStepIndex, advanceStep, setNextInstruction, setOffRoute, openRerouteDialog）, routeStore（currentLegs）
- **依存utils**: geometry（closestPointOnSegment）, offRouteCheck（checkOffRoute）, polylineCodec（decodePolyline）
- **呼び出し元**: NavigationScreen.tsx

### useAutoZoom（src/hooks/useAutoZoom.ts）

- **責務**: オートズーム（D-023）。時間先読みモデル（15秒）でベースラインズームを算出し、ターン接近時（300m→100m）に最大+2レベルのブーストを適用する。レート制限 ±0.5/更新、4.5秒間隔
- **依存store**: navigationStore（zoomMode, currentStepIndex）, routeStore（currentLegs）
- **引数**: speed: number, distanceToNextStepM: number
- **戻り値**: number（算出されたズームレベル）
- **呼び出し元**: NavCameraSync.tsx

### useRouteCalculation（src/hooks/useRouteCalculation.ts）

- **責務**: ウェイポイント変更を検知し、Routes API v2 でルートを自動計算する。レスポンスからlegs/stepsを解析し道路種別を判定してstoreに反映
- **依存store**: routeStore（currentRoute.waypoints, travelMode, setRouteData, setRouteError, setIsCalculatingRoute）
- **依存service**: routeApi（computeRoutes）、flightRecorder
- **依存utils**: roadType（classifyRoadType）
- **呼び出し元**: RoutePolyline.tsx

### useMapClickHandler（src/hooks/useMapClickHandler.ts）

- **責務**: 地図タップ時にウェイポイントを追加する。Placeアイコンタップ（経路A）と地図面タップ（経路B）を分離し、経路AではPlaces APIでPlace名を取得、経路Bでは座標のみでウェイポイントを作成する
- **依存store**: routeStore（addWaypoint）、uiStore（viewMode）
- **依存service**: flightRecorder
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

### useMapViewState（src/hooks/useMapViewState.ts）

- **責務**: ルート保存時の地図 center/zoom を記録し、ルートロード時に復元する
- **使用箇所**: MapViewState.tsx
- **依存**: routeStore（mapCenter, mapZoom）

### usePlaceCache（src/hooks/usePlaceCache.ts）

- **責務**: SavedPlace の photoUrl / originalName が null または期限切れの場合に Google Places API から再取得する。セッション内メモリキャッシュ付き
- **使用箇所**: PlaceList, PlaceDetailModal
- **依存**: placeStore（updatePlace）, placeDetailsService
- **公開関数**:
  - 戻り値: `{ photoUrl, originalName, isLoading, refetch }`

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

### placeStorage.ts（src/services/placeStorage.ts）

- **責務**: 保存済み場所データの localStorage 永続化
- **公開関数**:
  - `placeStorageService.getPlaces()` — 全場所を読み込み
  - `placeStorageService.savePlace(place)` — 場所を保存（既存IDは上書き、新規は追加）
  - `placeStorageService.deletePlace(placeId)` — 場所を削除
  - `placeStorageService.getPlace(placeId)` — IDで場所を1件取得
  - `placeStorageService.findByGooglePlaceId(googlePlaceId)` — Google Place IDで場所を検索

### placeDetailsService.ts（src/services/placeDetailsService.ts）

- **責務**: Google Places API (Place class) を使って施設情報（displayName, formattedAddress, rating, photos）を取得する共通サービス
- **公開関数**:
  - `fetchPlaceDetails(placeId: string)` — placeId から施設情報を取得。戻り値: `{ name, address, rating, photoUrl }`（全て nullable）
- **使用箇所**: useMapClickHandler, usePlaceCache

### rerouteService.ts（src/services/rerouteService.ts）

- **責務**: 逸脱時の3選択肢リルート。Routes API v2 を呼び出し、リルートポリラインを返す
- **公開関数**:
  - `rerouteBackToRoute(currentPosition, steps, currentStepIndex)` — 現在地から未通過の直近ステップ開始地点へのルート計算
  - `rerouteToNextWaypoint(currentPosition, waypoints, currentLegIndex)` — 現在地から次の経由地までのルート計算
  - `rerouteToDestination(currentPosition, waypoints, currentLegIndex)` — 現在地から残り全経由地を経由して目的地までのルート計算
- **依存**: routeApi（computeRoutes）, flightRecorder
- **使用箇所**: RerouteDialog.tsx

### simGeolocation.ts（src/services/simGeolocation.ts）

- **責務**: navigator.geolocation の watchPosition / getCurrentPosition / clearWatch をパッチし、sensorStore の sim 値に基づいて PG の callback を制御する（D-029, D-030）
- **パッチパターン**: Watch 型
- **公開関数**:
  - `installSimGeolocation()` — main.tsx から React render 前に呼ばれる。?debug パラメータがある場合のみ
- **内部動作**: sensorStore.subscribe で sim 値の変更を監視し、タイマーベースで PG の success/error callback を配信
- **使用箇所**: main.tsx（installSimGeolocation の呼び出し）

### simChannel.ts（src/services/simChannel.ts）

- **責務**: BroadcastChannel でリモコンポップアップ（sim-remote.html）と通信し、受信したメッセージを sensorStore に反映する
- **公開関数**:
  - `initSimChannel()` — BroadcastChannel を開き、メッセージリスナーを登録
  - `sendToRemote(message)` — リモコンにメッセージを送信
- **使用箇所**: SimButton.tsx（initSimChannel の呼び出し）

### flightRecorder.ts（src/services/flightRecorder.ts）

- **責務**: フライトレコーダー方式の常時構造化記録基盤（D-033）。旧 logService / userActionTracker / performanceMonitor を統合
- **公開関数**:
  - `flightRecorder.trace(cat, tag, data?)` — trace レベル記録
  - `flightRecorder.debug(cat, tag, data?)` — debug レベル記録
  - `flightRecorder.info(cat, tag, data?)` — info レベル記録
  - `flightRecorder.warn(cat, tag, data?)` — warn レベル記録
  - `flightRecorder.error(cat, tag, data?)` — error レベル記録
  - `flightRecorder.dump()` — 全エントリをフォーマット済み配列で出力
  - `flightRecorder.getRecent(count)` — 直近 count 件を取得
  - `flightRecorder.clear()` — バッファクリア
  - `flightRecorder.setConsoleLevel(level)` — コンソール出力レベルを変更
- **内部構造**: CircularBuffer（10,000 エントリ、O(1) push）
- **使用箇所**: 全 hooks / services / stores / components

### logFormatters.ts（src/services/logFormatters.ts）

- **責務**: レベル・カテゴリの数値→文字列変換、コンソール出力ヘルパー
- **公開関数**:
  - `toLevelName(n)` — 数値をレベル名に変換
  - `toCategoryName(n)` — 数値をカテゴリ名に変換
  - `formatWallClock(perfNow, startWall)` — performance.now() を壁時計文字列に変換

### flightRecorderDevTools.ts（src/services/flightRecorderDevTools.ts）

- **責務**: window.__fr に検証コマンドを公開（verify, dump, clear, level）
- **公開関数**:
  - `installDevTools()` — window.__fr をセットアップ
- **使用箇所**: main.tsx

### logConfig.ts（src/services/logConfig.ts）

- **責務**: ログ参照レベルの設定を抽象化。URL ?log パラメータから読み取り
- **公開関数**:
  - `createLogConfig()` — URL パラメータからログレベルを読み取り LogConfig を返す
- **使用箇所**: main.tsx, DebugPanel.tsx

### bugReportService.ts（src/services/bugReportService.ts）

- **責務**: Bug ボタン押下時にスクリーンショット + FlightRecorder ダンプ + メタ情報をバンドル（D-034）
- **公開関数**:
  - `captureBugReport()` — スクリーンショット撮影 → ダンプ収集 → JSON ダウンロード
- **依存**: flightRecorder, html2canvas（動的 import）, APP_VERSION
- **使用箇所**: BugReportButton.tsx

## コンポーネント責務一覧

#### map/

### MapView.tsx（src/components/map/）

- **責務**: ルート編集画面の地図表示。Map コンポーネントをラップし mapId・デフォルト center/zoom を設定
- **依存**: routeStore（なし）、uiStore（なし）。Props で onClick / children を受け取る

### MapInitialView.tsx（src/components/map/）

- **責務**: useMapInitialView フックの呼び出しシェル。レンダリングなし（return null）
- **依存**: hooks/useMapInitialView

### MapViewState.tsx（src/components/map/）

- **責務**: useMapViewState フックの呼び出しシェル。レンダリングなし（return null）
- **依存**: hooks/useMapViewState

### RoutePolyline.tsx（src/components/map/）

- **責務**: ルート編集画面のポリライン描画。routeSteps から道路種別色分けポリラインを生成
- **依存**: routeStore（routeSteps）、utils/roadType

### WaypointMarkers.tsx（src/components/map/）

- **責務**: ウェイポイントの AdvancedMarker 表示。S=緑 / G=赤 / 中間=黄 でピン色分け。ラベル番号付き
- **依存**: routeStore（currentRoute.waypoints）

#### navigation/

### cameraController（src/services/cameraController.ts）

- **種別**: シングルトンサービス
- **責務**: Google Maps カメラ API の唯一のインターフェース（D-037）。heading 補間、pivotZoom、wheelMode 管理、edge-follow 判定、panTo/moveCamera 選択を一元管理
- **依存**: navigationStore（getState のみ）, utils/edgeFollow, utils/headingUtils
- **使用箇所**: NavCameraSync, NavWheelZoom, ZoomInOutButtons

### NavCameraSync.tsx（src/components/navigation/）

- **責務**: navigationStore → cameraController への橋渡し（D-037）。ドラッグ検知による followMode 遷移、zoom_changed によるズームモード遷移
- **依存**: cameraController, navigationStore, useAutoZoom

### ZoomInOutButtons.tsx（src/components/navigation/）

- **責務**: +/- ズームボタンと P/N モードトグル。cameraController.zoomStep() を使用。idle イベントチェーンによる長押し加速、zoomStepFactor でズームレベル補正
- **依存**: cameraController

### NavigationScreen.tsx（src/components/navigation/）

- **責務**: ナビゲーション画面のルートコンポーネント。APIProvider + Map + 全ナビサブコンポーネントを配置。NavMapInitialFit（内部関数）でウェイポイント fitBounds
- **依存**: routeStore, navigationStore, 全 navigation/ コンポーネント

### NavControls.tsx（src/components/navigation/）

- **責務**: ナビ画面右側のコントロールボタン群レイアウト。HeadingButton / ZoomButton / FollowButton / SimButton を縦配置
- **依存**: HeadingButton, ZoomButton, FollowButton, SimButton

### NavHeader.tsx（src/components/navigation/）

- **責務**: ナビゲーションヘッダー。残距離・残時間・速度表示 + ナビ終了ボタン + GpsStatusIcon
- **依存**: navigationStore, uiStore, GpsStatusIcon, utils/formatters

### CurrentLocationMarker.tsx（src/components/navigation/）

- **責務**: ナビ画面の現在地マーカー（三角ポインター）。heading に連動して回転。positionQuality に応じて色・点滅を切替
- **依存**: navigationStore（currentPosition, heading, positionQuality）

### AccuracyCircle.tsx（src/components/navigation/）

- **責務**: GPS 精度リング。google.maps.OverlayView でパルスアニメーション付き円を描画。accuracy メートル値を地図ズームに合わせた半径で表示
- **依存**: navigationStore（currentPosition, accuracy, positionQuality）

### GpsStatusIcon.tsx（src/components/navigation/）

- **責務**: NavHeader 内の GPS 状態アイコン。quality に応じた SVG + lost 秒数 / accuracy 値表示。タップでポップオーバー（状況説明・対応指示）
- **依存**: navigationStore（positionQuality, accuracy, lostSince）

### FollowButton.tsx（src/components/navigation/）

- **責務**: followMode トグルボタン（auto/free）。free 時に表示され、タップで auto に復帰
- **依存**: navigationStore（followMode, setFollowMode）

### HeadingButton.tsx（src/components/navigation/）

- **責務**: headingMode トグルボタン（headingUp/northUp）。コンパス SVG で現在 heading を反映
- **依存**: navigationStore（headingMode, setHeadingMode, heading）

### ZoomButton.tsx（src/components/navigation/）

- **責務**: autoZoom/lockedZoom トグルボタン。SVG アイコンで Auto/Lock 表示。Lock 時は赤文字
- **依存**: navigationStore（zoomMode, setZoomMode）

### NavWheelZoom.tsx（src/components/navigation/）

- **責務**: ホイールイベント検知 → cameraController.wheelZoom() への委譲（D-037）。150ms debounce で余韻カット
- **依存**: cameraController, normalize-wheel, navigationStore（followMode）

### NavRoutePolyline.tsx（src/components/navigation/）

- **責務**: ナビ画面のルートポリライン描画。routeSteps から道路種別色分け。ステップ通過状態に応じて opacity 制御（通過済み=0.3、未通過=元の色）。リルートポリラインをグレー破線で表示
- **依存**: routeStore（routeSteps）, navigationStore（currentStepIndex, stepPassages, reroutePolyline）, utils/roadType

### StepDebugMarkers.tsx（src/components/navigation/）

- **責務**: デバッグ用ステップマーカー。?debug=1 時に各ステップ端点を色分け AdvancedMarker で表示（緑=通過済み、青=現在、灰=未到達）。クリックでステップ詳細ポップオーバー
- **依存**: navigationStore（currentStepIndex, stepPassages）, routeStore（currentLegs）

### OffRouteBanner.tsx（src/components/navigation/）

- **責務**: 逸脱警告バナー。isOffRoute=true 時に画面上部中央に「ルートから逸脱しています（Xm）」を rose-600 背景で表示
- **依存**: navigationStore（isOffRoute, offRouteDistance）

### RerouteDialog.tsx（src/components/navigation/）

- **責務**: リルートダイアログ（3選択肢）。逸脱地点に戻る / 次の経由地までリルート / 目的地までリルート。ローディング状態・エラーハンドリング付き
- **依存**: navigationStore（showRerouteDialog, isRerouting）, services/rerouteService, flightRecorder

### BugReportButton.tsx（src/components/navigation/）

- **責務**: Bug レポート FAB（左下）。タップで bugReportService を呼び出し JSON ダウンロード
- **依存**: services/bugReportService

### SimButton.tsx（src/components/navigation/）

- **責務**: SIM リモコンポップアップの開閉ボタン。?debug=1 時のみ表示。BroadcastChannel 通信管理
- **依存**: services/simChannel

### SimPositionCross.tsx（src/components/navigation/）

- **責務**: sim 座標の青十字マーカー。sensorStore の sim position を直接参照し AdvancedMarker で表示。点滅アニメーション付き
- **依存**: sensorStore（channelModes, simValues）

#### places/

### PlaceActionModal.tsx（src/components/places/）

- **責務**: Place アイコンタップ時のアクションモーダル。2段階 UI（actions → save）。「経路に追加」「保存」アクション
- **依存**: placeStore（placeModalOpen, placeModalData）、routeStore（addWaypoint）、PlaceSaveStep

### PlaceDetailModal.tsx（src/components/places/）

- **責務**: 保存済み場所の詳細表示・編集モーダル。メモ blur 保存、ラベル即時編集、削除。usePlaceCache で写真再取得
- **依存**: placeStore, labelStore, uiStore, hooks/usePlaceCache, PlaceLabelEditor

### PlaceLabelEditor.tsx（src/components/places/）

- **責務**: 場所のラベル選択 UI。forPlace=true のラベルをトグル表示。選択変更で即時保存
- **依存**: labelStore, placeStore

### PlaceResultList.tsx（src/components/places/）

- **責務**: 場所検索結果リスト。PlaceResult[] を Props で受け取り、選択コールバックを親に返す
- **依存**: なし（Props 駆動の表示コンポーネント）

### PlaceSaveStep.tsx（src/components/places/）

- **責務**: PlaceActionModal の保存ステップ。ラベル選択 + メモ入力 → SavedPlace 保存
- **依存**: labelStore, placeStore

### PlaceSearch.tsx（src/components/places/）

- **責務**: 場所検索。Places Autocomplete API で候補取得、選択でウェイポイント追加。insertIndex 対応
- **依存**: routeStore, uiStore, PlaceResultList

### SearchModal.tsx（src/components/places/）

- **責務**: 検索モーダルのシェル。PlaceSearch をラップ。insertIndex 管理、閉じる時のクリーンアップ
- **依存**: uiStore, PlaceSearch

#### route/

### RouteEditor.tsx（src/components/route/）

- **責務**: ルート編集画面のサイドバー。ルート名入力 + WaypointList + RouteSummary + RouteLabelSelector を配置
- **依存**: routeStore, uiStore, WaypointList, RouteSummary, RouteLabelSelector

### WaypointList.tsx（src/components/route/）

- **責務**: ウェイポイント一覧。framer-motion Reorder でドラッグ並べ替え + 「経路を追加」ボタン
- **依存**: routeStore, uiStore, WaypointItem

### WaypointItem.tsx（src/components/route/）

- **責務**: ウェイポイント行。ドラッグハンドル + 名前表示 + 削除ボタン + 挿入（+）ボタン
- **依存**: routeStore, uiStore

### RouteSummary.tsx（src/components/route/）

- **責務**: ルート概要表示。総距離・時間・ナビ開始ボタン・計算中/エラー状態表示
- **依存**: routeStore, navigationStore, uiStore, utils/formatters

### RouteLabelSelector.tsx（src/components/route/）

- **責務**: ルートのラベル選択 UI。forRoute=true のラベルをトグル表示。選択変更で isDirty → 自動保存
- **依存**: labelStore, routeStore

#### top/

### TopView.tsx（src/components/top/）

- **責務**: TOP 画面のルートコンポーネント。ヘッダー + タブバー（routes/labels/places）+ 各タブコンテンツ切替
- **依存**: uiStore, RouteList, LabelList, PlaceList, LabelEditModal, PlaceDetailModal, QrCodePopover

### RouteList.tsx（src/components/top/）

- **責務**: ルート一覧。タイル/リスト切替 + ソート + 検索フィルタ + 新規作成ボタン + 削除アニメーション
- **依存**: routeStore, labelStore, uiStore, hooks/useNewRoute, RouteCard, ViewToggle, SortSelector, SearchInput

### RouteCard.tsx（src/components/top/）

- **責務**: ルートカード（タイル/リスト両対応）。サムネイル + 名前 + 距離・時間 + ラベルチップ + 削除ボタン
- **依存**: labelStore, LabelChip

### LabelList.tsx（src/components/top/）

- **責務**: ラベル一覧。タイル/リスト切替 + 検索 + 新規作成ボタン + LabelEditModal 連携。件数は実データ集計
- **依存**: labelStore, routeStore, placeStore, uiStore, LabelCard, ViewToggle, SearchInput

### LabelCard.tsx（src/components/top/）

- **責務**: ラベルカード（タイル/リスト両対応）。色チップ + 名前 + 紐付き件数 + 編集・削除ボタン
- **依存**: なし（Props 駆動）

### PlaceList.tsx（src/components/top/）

- **責務**: 場所一覧。タイル/リスト切替 + 検索 + PlaceDetailModal 連携。削除アニメーション付き
- **依存**: placeStore, labelStore, uiStore, PlaceCard, ViewToggle, SearchInput

### PlaceCard.tsx（src/components/top/）

- **責務**: 場所カード（タイル/リスト両対応）。写真 + 名前 + メモ + ラベルチップ + 削除ボタン。usePlaceCache で写真再取得
- **依存**: labelStore, hooks/usePlaceCache, LabelChip

#### ui/

### ConfirmDialog.tsx（src/components/ui/）

- **責務**: 確認ダイアログ。uiStore.confirmDialog で制御。オーバーレイ + メッセージ + 確定/キャンセルボタン
- **依存**: uiStore

### ErrorBoundary.tsx（src/components/ui/）

- **責務**: React エラーバウンダリ。開発モードでスタックトレース表示、本番モードでユーザー向けエラー画面。FlightRecorder にログ送信
- **依存**: services/flightRecorder

### DebugPanel.tsx（src/components/ui/）

- **責務**: デバッグパネル。?log パラメータ指定時に FlightRecorder のログをリアルタイム表示。レベルフィルタ付き
- **依存**: services/flightRecorder, services/logConfig

### LabelEditModal.tsx（src/components/ui/）

- **責務**: ラベル編集モーダル（ボトムシート型）。名前・色プリセット・forRoute/forPlace 編集。既存ラベル時は LabelLinkedItems を一体表示
- **依存**: labelStore, LabelLinkedItems

### LabelLinkedItems.tsx（src/components/ui/）

- **責務**: ラベル紐付きルート・場所リスト。ルートタップでルート編集画面遷移、場所タップで PlaceDetailModal 表示
- **依存**: routeStore, placeStore, labelStore, uiStore

### LabelChip.tsx（src/components/ui/）

- **責務**: ラベル表示チップ。色丸 + 名前のインライン表示。Props 駆動
- **依存**: なし（Props 駆動）

### QrCodePopover.tsx（src/components/ui/）

- **責務**: QR コードポップオーバー。現在 URL の QR コード表示。外側クリックで閉じる
- **依存**: qrcode.react

### SearchInput.tsx（src/components/ui/）

- **責務**: 検索入力コンポーネント。虫眼鏡アイコン + テキスト入力 + クリアボタン。Props 駆動
- **依存**: なし（Props 駆動）

### SortSelector.tsx（src/components/ui/）

- **責務**: ソート選択ドロップダウン。更新日/作成日/名前/距離 の4種類。Props で value/onChange
- **依存**: なし（Props 駆動）

### ViewToggle.tsx（src/components/ui/）

- **責務**: タイル/リスト表示切替トグル。LayoutGrid / List アイコン。Props 駆動
- **依存**: なし（Props 駆動）

## 外部依存パッケージ

| パッケージ | 用途 | 導入決定 |
|---|---|---|
| normalize-wheel | ホイールイベントのデバイス間差異を正規化（Facebook製） | D-035 |
| @types/normalize-wheel | normalize-wheel の TypeScript 型定義 | D-035 |

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

### searchFilter.ts（src/utils/searchFilter.ts）

- **責務**: 検索クエリで文字列配列をフィルタする。スペース区切り=AND、"|"区切り=OR、大文字小文字区別なし
- **公開関数**:
  - `matchesQuery(query, targets)` — 検索クエリが対象文字列配列にマッチするか判定。OR が先に評価される（"A B|C" → "A AND (B OR C)"）

### polylineCodec.ts（src/utils/polylineCodec.ts）

- **責務**: Google Encoded Polyline Algorithm のエンコード・デコード
- **公開関数**:
  - `decodePolyline(encoded)` — エンコード済みポリライン文字列を `{ lat, lng }[]` に変換
  - `encodePolyline(points)` — `{ lat, lng }[]` をエンコード済みポリライン文字列に変換

### simplifyPolyline.ts（src/utils/simplifyPolyline.ts）

- **責務**: Douglas-Peucker アルゴリズムによるポリラインの簡略化
- **公開関数**:
  - `simplifyPolyline(points, tolerance?)` — 座標配列を指定した許容誤差で間引く（デフォルト tolerance = 0.0001）

### thumbnailUrl.ts（src/utils/thumbnailUrl.ts）

- **責務**: Static Maps API を使ったルートサムネイルURL生成。3段階フォールバック（ポリライン→マーカー→地図）対応
- **公開関数**:
  - `generateThumbnailUrl(encodedPolyline, apiKey)` — ポリライン付きサムネイルURL生成。長すぎる場合は簡略化してリトライ
  - `generateMarkerThumbnailUrl(waypoints, zoom, apiKey)` — マーカーのみのサムネイルURL生成
  - `generateMapThumbnailUrl(center, zoom, apiKey)` — マーカーなし地図サムネイルURL生成
  - `migrateThumbnails(routes, apiKey)` — thumbnailUrl 未設定のルートに対して3段階フォールバックでURL付与

### validation.ts（src/utils/validation.ts）

- **責務**: データバリデーションユーティリティ
- **公開関数**:
  - `isValidPosition(pos)` — 座標が有効か検証（NaN, Infinity, (0,0) を拒否）

### routeThumbnail.ts（src/utils/routeThumbnail.ts）

- **責務**: ルートサムネイルURL生成のファサード（3段階フォールバックを集約）
- **公開関数**:
  - `generateRouteThumbnailUrl(saved, apiKey)` — ポリライン → マーカー → 地図のみ の優先順でサムネイルURLを生成
  - `generateRouteThumbnailUrlSmall(saved, apiKey)` — スモール版（150x86）サムネイルURLを生成（sm未満のカード用）
- **使用箇所**: routeStore（saveCurrentRoute）

### geometry.ts（src/utils/geometry.ts）

- **責務**: 線分上の最近接点を計算する幾何ユーティリティ
- **公開関数**:
  - `closestPointOnSegment(point, segStart, segEnd)` — 点から線分への垂線の足を計算し、最近接点と距離（メートル）を返す。heading/distance ベースの投影計算
- **使用箇所**: useStepProgression, useRouteSnap

### edgeFollow.ts（src/utils/edgeFollow.ts）

- **責務**: free モードでマーカーが画面端に到達した際の最小シフト計算（D-036）
- **公開関数**:
  - `computeEdgeFollow(markerPosition, mapBounds, marginPx, zoom)` — マーカーが画面端120pxマージン内に入った場合に、マーカーを画面内に留めるための最小 lat/lng シフトベクトルを返す。マージン外なら null
- **使用箇所**: cameraController.ts（followMode=free 時）

### offRouteCheck.ts（src/utils/offRouteCheck.ts）

- **責務**: ヒステリシス付き逸脱判定。進入閾値50m / 復帰閾値30m でフリッカーを防止
- **公開関数**:
  - `checkOffRoute(distance, currentlyOffRoute)` — 距離と現在の逸脱状態から、次の逸脱状態（boolean）を返す。ステートレスな純関数
- **使用箇所**: useStepProgression

### headingUtils.ts（src/utils/headingUtils.ts）

- **責務**: 0度/360度 境界を跨ぐ回転で最短方向のデルタを計算する
- **公開関数**:
  - `shortestDelta(from, to)` — -180〜+180 の範囲でデルタを返す（D-032）
- **使用箇所**: NavigationScreen, HeadingButton, CurrentLocationMarker

### routeSort.ts（src/utils/routeSort.ts）

- **責務**: ルート一覧のソート
- **公開関数**:
  - `sortRoutes(routes, sortKey)` — RouteSortKey に応じたソート。updatedAt/createdAt=降順、name=昇順（空名末尾）、distance=降順（legsなし末尾）
- **使用箇所**: RouteList.tsx

### generateId.ts（src/utils/generateId.ts）

- **責務**: UUID v4 形式のユニークID生成
- **公開関数**:
  - `generateId()` — `crypto.randomUUID()` を優先し、未対応環境では Math.random ベースのフォールバックで UUID v4 を生成

## Constants

### src/constants/cardLayout.ts

| 定数 | 値 | 説明 |
|---|---|---|
| `CARD_WIDTH` | `280` | タイルカードの幅 (px) |
| `CARD_THUMBNAIL_HEIGHT` | `160` | タイルカードのサムネイル/写真エリア高さ (px) |
| `CARD_WIDTH_SM` | `150` | スマホ用タイルカードの幅 (px) |
| `CARD_THUMBNAIL_HEIGHT_SM` | `86` | スマホ用タイルカードのサムネイル/写真エリア高さ (px) |

### src/constants/appConfig.ts

| 定数 | 値 | 説明 |
|---|---|---|
| `APP_NAME` | `"FlexRoute"` | アプリケーション名 |

### src/constants/

`appVersion.ts`、`appConfig.ts`、`cardLayout.ts` が存在する。
その他の定数はそれぞれのファイル内にローカル定義されている:

| 定数 | 定義場所 | 値 |
|------|---------|-----|
| `STORAGE_KEY` | services/storage.ts | `"flexroute:routes"` |
| `BUFFER_SIZE` | services/logFormatters.ts | `10000` |
| `LOG_LEVELS` | types/log.ts | `{ trace: 0, debug: 1, info: 2, warn: 3, error: 4 }` |
| `LOG_CATEGORIES` | types/log.ts | `{ NAV: 0, GPS: 1, SIM: 2, ... ERROR: 15 }` |
| `ROUTES_API_URL` | services/routeApi.ts | `"https://routes.googleapis.com/directions/v2:computeRoutes"` |
| `FIELD_MASK` | services/routeApi.ts | routes.duration, distanceMeters, polyline 等のフィールドマスク |
| `HIGH_ACCURACY_OPTIONS` | services/geolocation.ts | `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }` |
| `LAST_KNOWN_POSITION_KEY` | services/geolocation.ts | `"flexroute:lastKnownPosition"` |
| `STORAGE_KEY`（ラベル） | services/labelStorage.ts | `"flexroute:labels"` |
| `STORAGE_KEY`（場所） | services/placeStorage.ts | `"flexroute:places"` |
| `DEFAULT_ZOOM` | hooks/useMapInitialView.ts | `15` |
| `DEFAULT_CENTER` | hooks/useMapInitialView.ts | `{ lat: 35.6895, lng: 139.6917 }`（東京） |
| `FIT_BOUNDS_PADDING` | hooks/useMapInitialView.ts | `80` |
| `HIGHWAY_KEYWORDS` | utils/roadType.ts | `["高速", "有料", "自動車道", "IC", "JCT"]` |
| `NATIONAL_KEYWORDS` | utils/roadType.ts | `["国道"]` |
| `PREFECTURAL_KEYWORDS` | utils/roadType.ts | `["県道", "都道", "府道", "道道"]` |
| `ROAD_COLORS` | utils/roadType.ts | highway=#ec4899, national=#eab308, prefectural=#22c55e, local=#4f46e5 |
| `ENTER_THRESHOLD_M` | utils/offRouteCheck.ts | `50` |
| `EXIT_THRESHOLD_M` | utils/offRouteCheck.ts | `30` |
| `EDGE_MARGIN_PX` | utils/edgeFollow.ts | `120` |
| `LOOKAHEAD_SEC` | hooks/useAutoZoom.ts | `15` |
| `TURN_BOOST_MAX` | hooks/useAutoZoom.ts | `2`（ズームレベル） |
| `TURN_BOOST_START_M` | hooks/useAutoZoom.ts | `300` |
| `TURN_BOOST_END_M` | hooks/useAutoZoom.ts | `100` |
| `ZOOM_RATE_LIMIT` | hooks/useAutoZoom.ts | `±0.5 / 4.5秒` |
| `CARD_WIDTH` | constants/cardLayout.ts | `280` |
| `CARD_THUMBNAIL_HEIGHT` | constants/cardLayout.ts | `160` |
| `APP_VERSION` | constants/appVersion.ts | 現在のバージョン番号（CLAUDE.md のバージョン運用ルール参照） |

## フォーマットユーティリティ

### formatDuration(seconds)

- 1時間未満 → 「XX分」
- 1時間以上 → 「X時間XX分」

### formatDistance(meters)

- 1km未満 → 「XXXm」
- 1km以上 → 「X.Xkm」
