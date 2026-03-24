# FlexRoute 機能仕様書

> 最終更新: 2026-03-23

## 機能一覧

| ID | 機能 | 実装状態 | MS |
|----|------|---------|-----|
| F-MAP | 地図表示 | ✅ | 1-2 |
| F-LOC | 現在地表示 | ✅ | 1-2, 1-4, 1-5 |
| F-WP-ADD | ウェイポイント追加（地図タップ） | ✅ | 1-3 |
| F-WP-SEARCH | ウェイポイント追加（場所検索） | ✅ | 1-3 |
| F-WP-INSERT | ウェイポイント経由地挿入 | ✅ | 1-3 |
| F-WP-DELETE | ウェイポイント削除 | ✅ | 1-3 |
| F-WP-REORDER | ウェイポイント並び替え | ✅ | 1-3 |
| F-ROUTE-CALC | ルート計算（Routes API v2） | ✅ | 1-3 |
| F-ROUTE-POLY | ルートポリライン色分け表示 | ✅ | 1-3 |
| F-ROUTE-SAVE | ルート自動保存 | ✅ | 1-4 |
| F-ROUTE-LOAD | ルート読込 | ✅ | 1-4 |
| F-ROUTE-DELETE | ルート削除（確認ダイアログ付き） | ✅ | 1-4 |
| F-ROUTE-LIST | ルート一覧表示（タイル/リスト） | ✅ | 1-4 |
| F-ROUTE-NAME | ルート名編集（blur時保存） | ✅ | 1-4 |
| F-TOP | TOP画面（タブ切替） | ✅ | 1-4 |
| F-CONFIRM | 確認ダイアログ | ✅ | 1-4 |
| F-ERROR | ErrorBoundary（開発/本番切替） | ✅ | - |
| F-LOG | FlightRecorder（常時構造化記録 + 参照時フィルタ） | ✅ | 1-6 |
| F-BUGREPORT | バグレポート（スクリーンショット + ログダンプ） | ✅ | 1-6 |
| F-SOURCEMAP | Source Map（本番ビルドでもデバッグ可能） | ✅ | - |
| F-CACHE | キャッシュ対策（F5リロード） | ✅ | - |
| F-PLACE-MODAL | PlaceActionModal（施設写真・ラベル・ナビ開始） | ✅ | 1-5 |
| F-LABEL | ラベル管理（CRUD） | ✅ | 1-5 |
| F-PLACE | 場所保存・一覧 | ✅ | 1-5 |
| F-THUMB | ルートサムネイル（Static Maps API） | ✅ | 1-5 |
| F-ZOOM | ズーム制御（ホイール + ボタン + P/Nトグル） | ✅ | 1-6 |
| F-NAV | ナビゲーション（GPS追従・案内） | 🔧 Step 1-3 実装済み | 1-6 |
| F-NAV-WIPE | ワイプマップ（PiP） | 未実装 | 1-6 |
| F-NAV-REROUTE | 逸脱検知・リルート（3選択肢） | 🔧 Step 3 実装済み | 1-6 |
| F-GPS-LOG | GPS走行記録（ナビ中+常時） | 未実装 | 1-6 |
| F-TRAVEL-VIEW | 走行記録画面（一覧・選択・表示） | 未実装 | 1-6後 |
| F-LAYER | 表示レイヤー切替 | 未実装 | 1-6後 |
| F-KML | KMLエクスポート | 未実装 | 1-6後 |
| F-HISTORY | 履歴・Undo/Redo | 未実装・要検討 | 未定 |
| F-MOBILE | モバイルUI（ボトムシート） | 未実装 | 1-7 |
| F-SPIDER | クモの巣走破地図（deck.gl） | 未実装 | Phase2 |
| F-AUTH | 認証・アカウント管理 | 未実装 | Phase2 |
| F-APIKEY | 個人APIキー設定 | 未実装 | Phase2 |
| F-SUBSCRIBE | サブスクリプション課金（Stripe） | 未実装 | Phase2 |
| F-GEMINI | Gemini API 自然言語検索 | 未実装 | Phase2（検討） |
| F-THEME | カラーテーマ切替（プリセット選択） | 未実装 | 未定 |
| F-I18N | 多言語対応（i18n） | 未実装 | Phase2 |
| F-SECURITY | セキュリティ対策（OWASP Top 10準拠） | 未実装 | Phase2 |
| F-TEST | テスト自動化（Vitest + Playwright） | 基盤のみ | 1-5 |
| F-SIM | SensorBridge（センサーシミュレーション） | ✅ | 1-6 |
| F-WAKELOCK | 画面消灯防止（Wake Lock API） | 未実装 | 1-6 |
| F-DEVICE-ORIENT | 磁気センサー heading（DeviceOrientation） | 未実装 | 1-6 |

## 各機能の動作定義

---

### F-MAP: 地図表示

概要: Google Maps JavaScript API で地図を表示する。AdvancedMarker 対応の Map ID を使用。

動作フロー:
- App.tsx が APIProvider で Google Maps API をロード（libraries: ["places", "geometry"]）
- Map コンポーネントが mapId 付きで地図を描画
- isMapReady → true で地図操作可能に
- AdvancedMarker をウェイポイント・現在地に使用

入力: VITE_GOOGLE_MAPS_API_KEY, VITE_GOOGLE_MAPS_MAP_ID
出力: 地図がフルスクリーン（ルート編集時はサイドバー右側）に表示
エラー: API キー無効 → 地図表示不可。コンソールにエラー出力
関連: F-LOC, F-WP-ADD

---

### F-LOC: 現在地表示

概要: ナビゲーション画面でのみ GPS 位置を監視し、現在地マーカーを表示する。ルート編集画面では GPS を使用しない。

#### ルート編集画面（GPS 不使用）

- Geolocation API を一切呼ばない
- 現在地マーカーを表示しない
- 位置情報の権限ダイアログを表示しない
- 初期センタリングは lastKnownPosition（localStorage）で行う（詳細は useMapInitialView の仕様）

#### ナビゲーション画面（1-6 で実装）

- ナビ開始時に watchPosition（enableHighAccuracy: true）を起動
- coords.accuracy（メートル）の値で位置精度を管理
- PositionQuality: 'active'（位置受信中）/ 'lost'（一定時間結果なし）
- 現在地マーカーは watchPosition の結果でのみ表示
- ナビ終了時に最後の位置を lastKnownPosition として localStorage に保存

#### lastKnownPosition

- ナビゲーション終了時に書き込む
- ルート編集画面の初期センタリングで読み込む
- 構造: { lat, lng, updatedAt } を localStorage に保存
- キー: "flexroute:lastKnownPosition"

#### positionQuality

navigationStore が管理する:

| 値 | 意味 | 判定条件 |
|----|------|---------|
| 'active' | 位置受信中 | watchPosition から結果を受信 |
| 'lost' | 沈黙 | 適応的閾値（D-028）の時間 watchPosition から結果なし |
| 'denied' | 権限拒否 | GeolocationPositionError.PERMISSION_DENIED |

#### ナビ中の GPS 状態表示

**現在地マーカー（ポインター + パルスリング）:**
- ナビ開始後、位置情報が返るまで表示しない
- 一度表示されれば、その後 lost や denied になっても消えない（表現が変わるのみ）
- ポインター（三角矢印）: heading 連動で進行方向を向く。ポリラインの最近点にスナップ表示（D-027）
  - active: 青（#2563eb）
  - lost: 青（#2563eb）点滅
  - denied: 赤（#ef4444）
- パルスリング（周囲の円）: accuracy メートル値を地図のズームに合わせた半径で描画。pointer-events: none でクリック透過

**GPS アイコン（ナビヘッダー「ナビゲーション中」の右に表示）:**
- ナビ開始直後は lost 状態（位置情報がまだ返っていない）
- lost: lost 継続時間を秒で表示。クリックで状況説明
- active: 精度を m 表示（最新値をそのまま表示）
- denied: 拒否アイコン。クリックで状況説明と対応指示（許可方法、許可後にナビ再開始を案内）

#### 地図初期表示（ルート編集画面）

ルート編集画面でウェイポイントなしの場合:
1. lastKnownPosition を localStorage から読み込む
2. 値あり → その座標でセンタリング
3. 値なし → 東京（35.6895, 139.6917）をデフォルト表示
- Geolocation API は呼ばない。全て同期的に即座に決定

入力: ナビ画面では watchPosition。ルート編集画面では lastKnownPosition（localStorage）
出力: ナビ画面では現在地マーカー。ルート編集画面ではマーカーなし
エラー: 位置取得拒否/失敗 → 東京をデフォルト表示
関連: F-MAP, F-NAV

---

### F-WP-ADD: ウェイポイント追加（地図タップ）

概要: 地図をタップしてウェイポイントを追加する。Place/座標は明確に分離。

動作フロー:
- ユーザーが地図をタップ
- useMapClickHandler で click イベントから e.detail.latLng と e.detail.placeId を取得
- placeId がある場合（経路A: Placeアイコンタップ）:
  - Places API fetchFields でPlace名を取得
  - addWaypoint({ label: place名, position, placeId, placeData: null })
  - 暫定実装。1-5で F-PLACE-MODAL 経由に変更予定
- placeId がない場合（経路B: 地図面タップ）:
  - reverseGeocode は絶対に呼ばない
  - addWaypoint({ label: "lat, lng"（小数点3桁）, position, placeId: null, placeData: null })
- ウェイポイントはリスト末尾に追加
- isDirty → true → 即座に自動保存
- userActionTracker で操作ログ記録

入力: 地図 click イベント
出力: routeStore.currentRoute.waypoints に追加。地図にマーカー表示。2件以上ならルート計算発火
エラー: Places API 失敗時 → 座標をウェイポイント名にフォールバック
関連: F-WP-SEARCH, F-ROUTE-CALC

---

### F-WP-SEARCH: ウェイポイント追加（場所検索）

概要: 検索モーダルで場所を検索し、選択してウェイポイントに追加する。

動作フロー:
- ユーザーが「経路を追加」ボタンをタップ
- uiStore.searchModalOpen → true、insertIndex → null（末尾追加）
- M-SEARCH モーダルが表示
- テキスト入力 → Google Places Autocomplete API で候補取得
- placeStore に結果を保持、リスト表示
- ユーザーが候補を選択
- addWaypoint({ label: place名, position, placeId, placeData: null }, insertIndex)
- モーダルを閉じ、insertIndex をクリア
- isDirty → true → 自動保存

入力: 検索テキスト入力 → Places Autocomplete API
出力: ウェイポイント追加。2件以上ならルート計算発火
エラー: Places API 失敗時 → 検索結果なしを表示
関連: F-WP-ADD, F-WP-INSERT, F-ROUTE-CALC

---

### F-WP-INSERT: ウェイポイント経由地挿入

概要: ウェイポイント間の「+」ボタンで任意の位置に経由地を挿入する。

動作フロー:
- ウェイポイント間に表示される「+」ボタンをタップ
- uiStore.searchModalOpen → true、insertIndex → index + 1
- M-SEARCH モーダルが「経由地を挿入」タイトルで表示
- 場所選択 → addWaypoint(waypoint, insertIndex) で指定位置に挿入
- モーダルを閉じ、insertIndex をクリア

入力: ウェイポイント間「+」ボタンタップ
出力: 指定位置にウェイポイント挿入。ルート再計算発火
エラー: なし（検索失敗は F-WP-SEARCH と同じ）
関連: F-WP-SEARCH, F-ROUTE-CALC

---

### F-WP-DELETE: ウェイポイント削除

概要: ウェイポイントを個別に削除する。

動作フロー:
- ウェイポイント行の削除ボタン（Xアイコン）をタップ
- routeStore.removeWaypoint(waypointId)
- waypoints 配列からフィルタで除外
- isDirty → true → 自動保存
- 2件以上残っていればルート再計算。1件以下ならルートデータクリア
- userActionTracker で操作ログ記録

入力: 削除ボタンタップ（waypointId）
出力: ウェイポイント除去。地図マーカー消去。ルート再計算 or クリア
エラー: なし
関連: F-ROUTE-CALC, F-ROUTE-SAVE

---

### F-WP-REORDER: ウェイポイント並び替え

概要: ドラッグ＆ドロップでウェイポイントの順序を変更する。

動作フロー:
- GripVertical ハンドルをドラッグ（framer-motion Reorder）
- ドロップ → routeStore.reorderWaypoints(newOrder)
- isDirty → true → 自動保存
- ルート再計算発火
- userActionTracker で操作ログ記録

入力: ドラッグ＆ドロップ操作
出力: ウェイポイント順序変更。ルート再計算
エラー: なし
関連: F-ROUTE-CALC, F-ROUTE-SAVE

---

### F-ROUTE-CALC: ルート計算（Routes API v2）

概要: ウェイポイント2件以上で Routes API v2 を呼び出し、ルートを計算する。

動作フロー:
- useRouteCalculation フックがウェイポイント変更を検知（useEffect）
- ウェイポイント2件未満 → clearRouteData() で終了
- isCalculatingRoute → true
- computeRoutes() で Routes API v2 を呼び出し
  - origin: 最初のウェイポイント
  - destination: 最後のウェイポイント
  - intermediates: 中間ウェイポイント
  - travelMode: "DRIVE"、routingPreference: "TRAFFIC_AWARE"
  - 座標は { latitude, longitude } 形式（{ lat, lng } ではない）
- レスポンスから legs/steps を解析
  - 各 step の navigationInstruction.instructions で道路種別判定（classifyRoadType）
  - SavedRouteLeg / SavedRouteStep に変換
- routeStore.setRouteData({ totalDistanceMeters, totalDurationSeconds, encodedPolyline, steps, legs })
- isDirty → true → 自動保存
- performanceMonitor で API 応答時間を計測

入力: routeStore.currentRoute.waypoints（2件以上）
出力: routeSteps, encodedPolyline, currentLegs が更新。RouteSummary に距離・時間表示
エラー: API 失敗 → routeStore.setRouteError(message)。RouteSummary にエラー表示
関連: F-ROUTE-POLY, F-ROUTE-SAVE

---

### F-ROUTE-POLY: ルートポリライン色分け表示

概要: ルート計算結果を道路種別で色分けしたポリラインで地図に描画する。

動作フロー:
- RoutePolyline コンポーネントが routeSteps を受け取る
- 各ステップのポリラインをデコードし、Google Maps Polyline で描画
- classifyRoadType() で道路種別を判定、getRoadColor() で色を取得
  - highway → #ec4899（ピンク）
  - national → #eab308（黄色）
  - prefectural → #22c55e（緑）
  - local → #4f46e5（インディゴ）
- ウェイポイント2件未満 → ポリラインをクリア

入力: routeStore.routeSteps（RoutesApiStep[]）
出力: 地図上に色分けされたポリライン表示
エラー: ポリラインデコード失敗 → 該当ステップをスキップ
関連: F-ROUTE-CALC

---

### F-ROUTE-SAVE: ルート自動保存

概要: ウェイポイント変更やルート名編集時に自動で localStorage に保存する。

動作フロー:
- isDirty === true かつ保存条件成立時に saveCurrentRoute() を呼び出し
- 保存条件: ウェイポイント1件以上 OR ルート名がtrim()で空でない
- toSavedRoute() で Route → SavedRoute に変換
  - 既存ルート → version + 1
  - 新規ルート → version = 1
  - createdAt / updatedAt を ISO 8601 で設定
- localStorageService.saveRoute(saved)
- savedRoutes 配列を更新（既存は上書き、新規は追加）
- isDirty → false
- logService でログ出力

入力: routeStore の状態変更（isDirty === true）
出力: localStorage に SavedRoute を永続化
エラー: localStorage 容量超過 → エラーログ。データは失われない（前回の保存が残る）
関連: F-ROUTE-LOAD, F-ROUTE-DELETE

---

### F-ROUTE-LOAD: ルート読込

概要: 保存済みルートを選択して編集画面に読み込む。

動作フロー:
- TOP画面でルートカードをタップ
- routeStore.loadRoute(id) を呼び出し
- savedRoutes から該当ルートを検索
- toRoute() で SavedRoute → Route に変換
- currentRoute, routeName, encodedPolyline, currentLegs を設定
- isDirty → false
- uiStore.setViewMode("route") で編集画面に遷移
- logService で読み込みログ

入力: ルートID
出力: 編集画面にルートが表示（ウェイポイント、ポリライン、RouteSummary）
エラー: ID不一致 → 何もしない
関連: F-ROUTE-SAVE, F-ROUTE-LIST

---

### F-ROUTE-DELETE: ルート削除（確認ダイアログ付き）

概要: ルートを削除する。確認ダイアログで誤操作を防止。

動作フロー:
- ルートカードの削除ボタンをタップ
- uiStore.openConfirmDialog("このルートを削除しますか？", onConfirm)
- M-CONFIRM ダイアログが表示
- 「削除する」→ routeStore.deleteRoute(id)
  - localStorageService.deleteRoute(id)
  - savedRoutes から除外
  - logService で削除ログ
- 「キャンセル」→ ダイアログ閉じるのみ

入力: 削除ボタンタップ → 確認ダイアログ → 確定
出力: localStorage とメモリから該当ルートを完全削除
エラー: なし
関連: F-CONFIRM, F-ROUTE-LIST

---

### F-ROUTE-LIST: ルート一覧表示（タイル/リスト）

概要: 保存済みルートをタイル形式またはリスト形式で一覧表示する。

動作フロー:
- TOP画面の「ルート」タブが表示されると routeStore.loadSavedRoutes() を実行
- localStorageService.getRoutes() で全ルートを取得
- RouteCard コンポーネントで各ルートを表示
  - タイル: 2列グリッド、rounded-2xl、ルート名・距離・時間
  - リスト: 1列、rounded-xl、コンパクト表示
- 表示切替: uiStore.routeViewMode（"tile" / "list"）
- 並び順選択: uiStore.routeSortKey で4種類から選択
  - "updatedAt"（デフォルト）: 更新日の降順（新しい順）
  - "createdAt": 作成日の降順（新しい順）
  - "name": 名前の昇順（localeCompare で日本語対応）。空名は末尾
  - "distance": 総距離の降順（長い順）。legs の distanceMeters を合算。legs が空の場合は末尾
- ソートは検索フィルタ後に適用
- ルート名がtrim()で空 → 「名称未設定」（text-slate-400 italic）
- 0件時 → 空状態メッセージ

入力: routeStore.savedRoutes
出力: ルートカードの一覧表示
エラー: localStorage 読み取り失敗 → 空配列
関連: F-ROUTE-LOAD, F-ROUTE-DELETE, F-TOP

---

### F-ROUTE-NAME: ルート名編集（blur時保存）

概要: ルート名を入力欄で編集し、フォーカスアウト時に保存する。

動作フロー:
- サイドバーヘッダーの入力欄に routeStore.routeName を表示
- onChange → routeStore.setRouteName(value)（メモリ上のみ、isDirty → true）
- onBlur → 保存条件成立なら saveCurrentRoute()
- 画面遷移時: 入力欄の blur を先に発火させてから遷移
- debounce タイマーは使用しない
- F5でテキスト入力中の数文字が失われることは許容

入力: テキスト入力 → blur イベント
出力: ルート名が更新・保存される
エラー: なし
関連: F-ROUTE-SAVE

---

### F-TOP: TOP画面（タブ切替）

概要: アプリのホーム画面。ルート/ラベル/場所のタブで切替。

動作フロー:
- viewMode === "top" で TopView コンポーネントを表示
- ヘッダー: bg-indigo-600、アプリ名「FlexRoute」
- タブバー: uiStore.topTab で切替（"routes" / "labels" / "places"）
- 「ルート」タブ: F-ROUTE-LIST
- 「ラベル」タブ: F-LABEL（ラベル一覧・CRUD）
- 「場所」タブ: F-PLACE（場所一覧・詳細・保存）
- 「新規作成」ボタン → routeStore.newRoute() → viewMode → "route"

入力: タブ切替、新規作成ボタン
出力: 画面切替、ルート一覧表示
エラー: なし
関連: F-ROUTE-LIST, F-ROUTE-LOAD

---

### F-CONFIRM: 確認ダイアログ

概要: 削除等の操作前に確認ダイアログを表示して誤操作を防止する。

動作フロー:
- uiStore.openConfirmDialog(message, onConfirm) で表示
- オーバーレイ: bg-black/50 backdrop-blur-sm
- カード: bg-white rounded-2xl、メッセージ + 2ボタン
- 「削除する」→ onConfirm() を実行 → closeConfirmDialog()
- 「キャンセル」→ closeConfirmDialog()

入力: uiStore.confirmDialog.isOpen === true
出力: 確認後にコールバック実行
エラー: なし
関連: F-ROUTE-DELETE

---

### F-ERROR: ErrorBoundary（開発/本番切替）

概要: Reactのエラーバウンダリでクラッシュを捕捉し、適切なエラー画面を表示する。

動作フロー:
- App.tsx で ErrorBoundary がアプリ全体をラップ
- 開発モード（import.meta.env.DEV）:
  - エラーが発生したコンポーネント名を表示
  - エラーメッセージを表示
  - スタックトレースを折りたたみ表示（デフォルト閉）
  - コンポーネントスタックを表示
- 本番モード（import.meta.env.PROD）:
  - ユーザーフレンドリーなメッセージのみ:「エラーが発生しました。再読み込みしてください。」
  - 「アプリを再読み込み」ボタン（location.reload()）
- 両モード共通:
  - キャッチしたエラーを LogService に送る
  - MapView 等の主要コンポーネントにも個別に ErrorBoundary を配置（地図のエラーでサイドバーまで死なないようにする）

入力: React レンダリングエラー
出力: エラー画面表示
エラー: —
関連: F-LOG

---

### F-LOG: FlightRecorder（v2 実装済み）

概要: フライトレコーダー方式による常時構造化記録 + 参照時フィルタ。トラブルシュートの基盤（D-033）。

原則: **常に全レベルを構造化記録する。ログレベルは参照時のフィルタであり、記録時のフィルタではない。**

#### ログレベル（5段階）

| レベル | 数値 | 用途 | 例 |
|---|---|---|---|
| trace | 0 | 高頻度センサーデータ | GPS座標、heading値、snap距離、callback tick |
| debug | 1 | 状態遷移・内部判定 | lost→active遷移、閾値算出結果、モード切替 |
| info | 2 | 業務イベント | ナビ開始/終了、ルート保存、Place保存 |
| warn | 3 | 劣化・閾値超過 | GPS精度悪化、API 5秒超、lost検知 |
| error | 4 | 障害 | API失敗、permission denied |

#### 記録フォーマット

- 記録時: 構造化データ（数値 + enum 番号）。文字列を生成しない。タイムスタンプは performance.now()
- 参照時（DebugPanel 表示・Bug レポートダンプ時）に初めて enum→文字列、performance.now()→ISO時刻に変換

#### ?log パラメータ（参照制御）

| パラメータ | コンソール出力 | DebugPanel | 記録 |
|---|---|---|---|
| なし（デフォルト） | なし | 非表示 | 全レベル常時記録 |
| ?log=warn | warn + error | 表示 | 同上 |
| ?log=info | info 以上 | 表示 | 同上 |
| ?log=debug | debug 以上 | 表示 | 同上 |
| ?log=trace | 全レベル | 表示 | 同上 |

?debug=1（sim 用）とは独立。?debug=1&log=trace で sim + 全ログ出力。

#### バッファ

- 単一の循環バッファ（旧 logService + userActionTracker + performanceMonitor を統合）
- O(1) push（shift() 方式を廃止）
- 10,000 エントリ / 730KB / 6 entries/sec で約28分保持

#### DebugPanel

- ?log または ?debug パラメータ指定時に表示（本番ビルドでも可）
- レベルフィルタ付き統合ビュー

#### 検証コマンド（コンソール）

- `__fr.verify()` — バッファ状態・カテゴリ別件数・重複検出・直近5件を出力
- `__fr.dump()` — 全エントリをフォーマット済み配列で返す
- `__fr.clear()` — バッファクリア
- `__fr.level("trace")` — コンソール出力レベルを変更

入力: 各 services / stores / hooks / components からの fr.trace/debug/info/warn/error 呼び出し
出力: 循環バッファへの構造化エントリ蓄積。?log 指定時はコンソール出力。Bug レポートでダンプ
エラー: —
関連: F-BUGREPORT, F-ERROR, F-SIM, D-033

---

### F-BUGREPORT: バグレポート（実装済み）

概要: ナビゲーション画面の Bug ボタンで、スクリーンショット + FlightRecorder ダンプ + メタ情報をバンドルして回収する（D-034）。

#### 動作フロー

1. ユーザーが Bug ボタン（FAB）をタップ
2. html2canvas で画面キャプチャ（動的 import でバンドルサイズに影響なし）
3. FlightRecorder から全エントリをダンプ（ダンプ時にフォーマット変換）
4. メタ情報を収集: 時刻、APP_VERSION、URL パラメータ、User-Agent、画面サイズ
5. JSON 単一ファイルとしてダウンロード

#### バンドル内容

flexroute-bug-{timestamp}.json に以下を集約:

- meta: 時刻, APP_VERSION, URL, User-Agent, 画面サイズ
- screenshot: base64 data URL（html2canvas 失敗時は null）
- entries: FlightRecorder 全エントリ（フォーマット済み）

#### 出力方式

| Phase | 方式 |
|---|---|
| Phase 1（実装済み） | JSON 単一ファイルとしてダウンロード（screenshot は base64 埋め込み） |
| Phase 2 | zip 分離（JSZip）またはサーバアップロード（presigned URL → S3） |

#### Bug ボタンの表示

- ナビゲーション画面の左下に常時表示
- 小さい FAB（bg-rose-500/80, w-10 h-10）
- ?log や ?debug の有無に関係なく使用可能

#### 既知の制約

- html2canvas が Google Maps のタイル画像（CORS 制約）を canvas に描画できず、screenshot が null になる場合がある。ログデータは正常に回収できる

入力: Bug ボタンタップ
出力: flexroute-bug-{timestamp}.json ダウンロード
エラー: html2canvas 失敗 → screenshot=null でログのみバンドル
関連: F-LOG, F-NAV, D-034

---

### F-SOURCEMAP: Source Map（本番ビルドでもデバッグ可能）

概要: 本番ビルドでも Source Map を生成し、本番環境でのデバッグを可能にする。

動作フロー:
- Vite の build.sourcemap 設定で有効化
- 本番デプロイ時もブラウザDevToolsで元のTypeScriptソースを表示可能

入力: ビルド設定
出力: .map ファイル生成
エラー: —
関連: F-ERROR

---

### F-CACHE: キャッシュ対策（F5リロード）

概要: ブラウザキャッシュによる古いコード実行を防止する。

動作フロー:
- Vite のファイル名ハッシュ付きビルド出力
- デプロイ時に古いキャッシュが自動的に無効化される

入力: ビルド設定
出力: ハッシュ付きファイル名
エラー: —
関連: —

---

### F-PLACE-MODAL: PlaceActionModal（1-5で実装）

概要: Placeアイコンタップ時に施設情報と操作選択を表示するモーダル。

仕様:
- Placeアイコンタップで表示（現在は即座にウェイポイント追加する暫定実装を置き換え）
- 表示情報: 施設写真、名前、住所、評価
- アクションボタン:
  - 「経路に追加」→ ウェイポイント追加
  - 「ラベルを付ける」→ F-LABEL 連携
  - 「ナビ開始」→ F-NAV 連携

関連: F-WP-ADD, F-LABEL, F-NAV

---

### F-LABEL: ラベル管理（1-5で実装）

概要: 場所にラベル（タグ）を付けて分類・管理する。

仕様:
- ラベルの CRUD（作成・読取・更新・削除）
- TOP画面の「ラベル」タブに一覧表示
- ラベルで場所をフィルタ・検索
- ラベルには forRoute（ルート用）と forPlace（場所用）のフラグがある
- 新規作成時はデフォルトで両方 true
- ルートのラベル選択UIでは forRoute === true のラベルのみ表示
- 場所のラベル選択UIでは forPlace === true のラベルのみ表示

ルートのラベル付与:
- ルート編集画面のサイドバーで forRoute === true のラベルを選択可能
- 選択はトグル形式、変更は isDirty → 自動保存に乗る
- ルートカード（タイル/リスト）にラベルチップを表示
- 検索フィルタでラベル名にもマッチ

ラベル詳細ビュー（ラベル編集モーダル内）:
- ラベル編集モーダルはボトムシート型（PlaceDetailModal準拠、z-[100]）
- 既存ラベル編集時、紐付きルート・場所のリストをフォーム下部に一体表示（LabelLinkedItems）
- ルートタップ → ラベルモーダルを閉じてルート編集画面へ遷移
- 場所タップ → ラベルモーダルを閉じて PlaceDetailModal を開く
- LabelCard の件数は紐付きルート+場所の合計を実データから表示

関連: F-PLACE-MODAL, F-PLACE

---

### F-PLACE: 場所保存・一覧（1-5で実装、3セッション構成）

概要: お気に入りの場所を保存し、一覧表示する。

#### Session 1: データレイヤー（実装済み）

- SavedPlace 型定義（src/types/index.ts）
  - id, placeId, name, originalName, address, position, rating, photoUrl, labelIds, userNote, createdAt, updatedAt
  - originalName: ユーザーがnameを変更してもPlace元名を保持
- placeStorageService（src/services/placeStorage.ts）
  - localStorage CRUD + findByGooglePlaceId
  - キー: "flexroute:places"
- placeStore 拡張（savedPlaces + loadPlaces/savePlace/updatePlace/deletePlace/isSaved）
- PlaceList をダミーデータから実データ接続に変更
  - loadPlaces を useEffect で呼び出し
  - labelIds から実ラベルを解決して表示

#### Session 2: 保存フロー（実装済み）

- PlaceActionModal に2段階UI（actions → save）
- ラベル選択 + メモ入力 → SavedPlace 保存
- 保存済み判定（isSaved）

#### Session 3: 一覧 + 詳細 + 写真再取得（実装済み）

- usePlaceCache フック（photoUrl / originalName 再取得）
- PlaceDetailModal（メモblur保存、ラベル即時編集、削除）

設計判断:
- D-007（blur保存）をメモ編集に適用
- 写真URL: 保存時キャッシュ → 期限切れ時に placeId から再取得
- originalName: 写真と同仕様。ユーザーが name を変更しても保持

関連: F-PLACE-MODAL, F-LABEL

---

### F-THUMB: ルートサムネイル

概要: ルート一覧のカードにルートのサムネイル画像を表示する。Static Maps API で生成。

動作フロー:
- 保存時（saveCurrentRoute）に以下の3段階フォールバックでサムネイルURLを生成:
  1. ポリラインサムネイル（WP2件以上、encodedPolyline あり）: ポリライン+S/Gマーカー。center/zoom は API 自動調整
  2. マーカーサムネイル（WP1件以上、encodedPolyline なし）: WP位置のマーカーのみ。center=WP座標、zoom=保存時の mapZoom
  3. 地図サムネイル（WP0件）: マーカーなし。保存時の mapCenter / mapZoom を使用
- 全段階失敗時（通常フローでは発生しない）は thumbnailUrl = null、RouteCard で Map アイコンを表示
- 生成したURLを SavedRoute.thumbnailUrl にキャッシュする
- ルート変更時（version変更時）のみ再生成する
- RouteCard マウント時に毎回再生成してはならない（アンチパターン禁止1）
- ポリラインが長い場合は Douglas-Peucker で簡略化してURL長を削減してよい
  （この用途でのポリライン簡略化は許可。禁止されているのは「毎回のマウント時の再生成」）
- RouteCard のヘッダー部分に表示

入力: SavedRoute の encodedPolyline, waypoints, mapCenter, mapZoom
出力: Static Maps API の画像URL → SavedRoute.thumbnailUrl
エラー: API キー無効 → null（Map アイコン表示）
関連: F-ROUTE-LIST, F-ROUTE-SAVE

---

### F-ZOOM: ズーム制御（1-6で実装）

概要: ナビゲーション画面でのズーム制御。dynamic zoom（速度・ターン接近に応じた自動ズーム）、ホイール・ボタン・P/Nモード切替の4要素で構成。

#### ナビゲーション用語定義

| 軸 | モード名 | コード値 | 説明 |
|---|---|---|---|
| 追従 | center-auto | followMode: "auto" | 現在地を中心に自動追従 |
| 追従 | center-lock | followMode: "free" | ユーザーが自由に地図操作 |
| ズーム | zoom-auto | zoomMode: "autoZoom" | dynamic zoom が有効 |
| ズーム | zoom-lock | zoomMode: "lockedZoom" | ユーザー手動ズームを固定 |
| 方角 | head-up | headingMode: "headingUp" | 進行方向が上 |
| 方角 | north-up | headingMode: "northUp" | 常に北が上 |

**dynamic zoom**: zoom-auto モード時に動作するズーム自動調整機能。速度ベースの時間先読みモデル（speed × 15秒の到達距離を画面に収める）と、ターン接近ブースト（次ステップ 300m→100m で段階的にズームイン）を組み合わせる。レートリミット（±0.5/回、4.5秒間隔）で急激な変化を防止。center-auto / center-lock の両方で動作する。

#### ホイールズーム（followMode=auto 時）
- CameraController.init() で map div に wheel リスナーを登録（D-037）
- normalize-wheel ライブラリで deltaY をデバイス間で正規化
- ModeA.applyWheel() でマーカーピボットズームを実行
- ホイール停止後 150ms の debounce で moveCamera を呼び、Google Maps の余韻アニメーションを即時カット
- followMode=free 時は Google Maps のネイティブ動作を維持

#### ピボット計算（calcPivotCenter）
- cameraController/utils.ts の純粋関数（D-037）
- 計算式: newCenter = marker + (oldCenter - marker) x 2^(oldZoom - newZoom)
- マーカーの画面上ピクセル位置を不変に保つ
- setZoom + setCenter の2呼び出しでアニメーション付きズームを実現
- ホイールと +/- ボタン（Pモード）の両方から共有使用

#### ZoomInOutButtons（+/- ボタン + P/N トグル）
- pure UI コンポーネント。cameraController.onZoomButtonDown/Up を呼ぶだけ
- 長押し加速（idle チェーン）、zoomStepFactor は ModeA 内部で処理
- P モード（pivot-fine）: マーカーピボットズーム。ホイールと同一挙動
- N モード（native）: Google Maps のネイティブズームを使用。将来の動作比較用に保持

#### dynamic zoom（CameraController 内部）
- useAutoZoom フックを廃止し、CameraController 内部に吸収（v1.6.93）
- 計算ロジック: cameraController/utils.ts の calcAutoZoomTarget
- rate-limit（±0.5/回、4.5秒間隔）: cameraController/index.ts の calcAutoZoom

入力: マウスホイール、+/- ボタンタップ/長押し、P/N トグル
出力: 地図ズームレベル変更（マーカーピボット or ネイティブ）
エラー: なし
関連: F-NAV, D-035

---

### F-NAV: ナビゲーション（1-6で実装）

概要: 保存ルートに沿ってターンバイターンナビゲーションを行う。Routes API を再呼出しない。

仕様:
- 保存された legs/steps のポリラインと案内文でナビ（SPEC_NAVIGATION.md 参照）
- 追従モード状態マシン（auto / free）
- ズーム制御（autoZoom / lockedZoom）
- ヘッディング制御（headingUp / northUp）
- ナビゲーションヘッダー: 到着予想時間、残り距離、現在速度
- クイック検索カテゴリ: ガソリンスタンド、コンビニ、トイレ、レストラン
- 画面: S-NAV（地図フルスクリーン）

実装ステップ計画:
| Step | 内容 | 主な成果物 | 依存 |
|------|------|-----------|------|
| Step 1 | ステップ通過判定 + 案内文表示 | useStepProgression, StepPassage型, NavHeader案内文, ポリライン通過表現 | — |
| Step 2 | オートズーム（D-023） | cameraController 内 autoZoom, 時間先読みモデル, ターン接近ズーム | Step 1 |
| Step 3 | 逸脱検知 + リルートダイアログ | useOffRouteDetection, RerouteDialog, リルートポリライン | Step 1 |
| Step 4 | ワイプマップ（F-NAV-WIPE） | WipeMap, 動的配置, サイズ切替 | Step 2 |
| Step 5 | GPS走行記録（F-GPS-LOG） | GpsLog/TravelPoint型, gpsLogStore, gpsLogStorageService | Step 1 |
| Step 6 | 仕上げ + 残課題解消 | F-WAKELOCK, 25WP制限, ドキュメント最終更新 | Step 4, 5 |

Step 1 の詳細:
- StepPassage 型を types/ に追加（SPEC_NAVIGATION.md に定義済み）
- navigationStore に currentStepIndex, stepPassages[], isOffRoute, offRouteDistance を追加
- useStepProgression フック新規作成: 現在地と各ステップのポリラインを比較し最近ステップを特定。出口通過を検知し StepPassage を記録。次ステップの案内文・残距離をリアルタイム算出
- NavHeader に次の案内指示テキストを表示（「国道254号を左折」等）。残距離・残時間を実データで更新
- NavRoutePolyline で通過済み = opacity 0.3、未通過 = 元の色を描き分け

Step 2 の詳細:
- useAutoZoom フック新規作成: 速度ベースの時間先読みモデル（speed × 15秒 → ズーム逆算）
- ズーム変化量 ±0.5 制限、更新間隔 4.5秒以上（OsmAnd 準拠）
- ターン接近ズーム: 次ステップ 300m→100m で線形ズームイン、100m 以下でベースライン+2（上限 z18）、通過後 0.5秒でベースライン復帰
- lockedZoom 時はベースライン・ターン接近ズームとも全スキップ
- NavCameraSync に autoZoom 結果を統合し cameraController 経由でカメラ制御

Step 3 の詳細:
- useOffRouteDetection フック新規作成: ポリラインからの距離 50m 超で逸脱判定
- RerouteDialog コンポーネント新規作成: 3選択肢 UI（逸脱地点に戻る / 次の経由地までリルート / 目的地までリルート）
- 「次の経由地までリルート」がデフォルト（一定時間選択なしで自動選択）
- リルート実行時に Routes API を呼び出し、reroutePolyline に一時保存、グレー破線で描画
- GPS accuracy を活用した動的閾値は Phase 2 で検討（SPEC_NAVIGATION.md Step 3 検討事項 参照）

Step 4 の詳細:
- WipeMap コンポーネント新規作成: 2枚目の Map をオーバーレイ表示
- ルート全体を fitBounds で表示、現在地をドットで表示
- heading から進行方向を判定し位置を動的切替（SPEC_NAVIGATION.md の配置表に準拠）
- ルート総距離 50km 超で w-56 h-56 に拡大
- stopPropagation でメインマップとイベント分離

Step 5 の詳細:
- GpsLog / TravelPoint 型を types/ に追加（SPEC_NAVIGATION.md に定義済み）
- gpsLogStore 新規作成: rawPath への追加（3m 未満フィルタ、同一座標除外）
- gpsLogStorageService 新規作成: localStorage に保存、保存時に Douglas-Peucker で simplifiedPath 生成
- ナビ開始で type:'navigation' + routeId 紐付きの記録開始、ナビ終了で保存
- 1-6 スコープはナビ中の記録（type:'navigation'）のみ。非ナビ中の自動記録（type:'tracking'）は 1-6 後追加

Step 6 の詳細:
- F-WAKELOCK 実装: ナビ開始時に wakeLock.request('screen')、終了時に release()、visibilitychange で再取得
- 25WP 制限: addWaypoint で 25 件上限チェック、超過時にユーザー通知
- SIM リモコンで走行シミュレーションによる全ステップ統合確認
- ドキュメント最終更新: 全機能の実装状態を更新、新規型・Store・Service を SPEC_DATA.md に追記

関連: F-NAV-WIPE, F-NAV-REROUTE, F-GPS-LOG, F-LOC

---

### F-NAV-WIPE: ワイプマップ（1-6で実装）

概要: ナビ中にルート全体を俯瞰する小マップ（Picture in Picture）を表示する。

仕様:
- 位置: 進行方向に応じて動的配置（デフォルト右上）
- サイズ: 通常 w-40 h-40、ルート距離50km超は w-56 h-56
- イベント伝播: stopPropagation で分離（SPEC_NAVIGATION.md 参照）

関連: F-NAV

---

### F-NAV-REROUTE: 逸脱検知・リルート（1-6で実装）

概要: ルートから50m以上逸脱した場合に3選択肢のリルートダイアログを表示する。

仕様:
- 逸脱判定閾値: 50m（Step 3 で GPS accuracy を活用した動的閾値に拡張予定）
- 3選択肢: 逸脱地点に戻る / 次の経由地までリルート（デフォルト） / 目的地までリルート
- StepPassage でステップ通過を管理
- ポリラインデザイン: 通過済み=opacity 0.3、未通過=元の色、リルート=グレー破線
- 逸脱中の道路スナップ: Phase 2 で Snap to Roads API の散発的呼び出しを検討（D-027 参照）
- 詳細は SPEC_NAVIGATION.md 参照

関連: F-NAV, F-ROUTE-CALC

---

### F-GPS-LOG: GPS走行記録（1-6で実装）

概要: アプリ起動中は常にGPSログを記録する。ナビ中と非ナビ中を区別。

仕様:
- type: 'navigation'（ナビ中、routeId紐付き）/ 'tracking'（非ナビ中）
- 全座標を rawPath に保持。前回記録点から3m未満は除外
- 保存時: Douglas-Peucker（tolerance = 0.00005）で simplifiedPath を生成
- ON/OFF の選択肢はUIに設けない（常に記録）
- 1-6 スコープ: ナビ中の記録（type:'navigation'）のみ実装。非ナビ中の自動記録（type:'tracking'）は 1-6 後追加で実装
- 詳細は SPEC_NAVIGATION.md 参照

関連: F-NAV, F-TRAVEL-VIEW, F-KML

---

### F-TRAVEL-VIEW: 走行記録画面（1-6後追加で実装）

概要: 走行記録の一覧表示・フィルタ・複数選択・地図重畳表示。

仕様:
- TOP画面に「走行記録」タブを追加
- フィルタ: ルート別 / 日付別 / 全て
- 複数選択 → 地図に色分け Polyline で重畳表示
- アクション: KMLエクスポート、削除
- 詳細は SPEC_NAVIGATION.md 参照

関連: F-GPS-LOG, F-KML, F-TOP

---

### F-LAYER: 表示レイヤー切替（1-6後追加で実装）

概要: ルート編集画面で予定ルート・ウェイポイント・走行記録の表示を個別に切替。

仕様:
- チェックボックスパネル: 予定ルート / ウェイポイント / 走行記録
- 走行記録 ON → 日付選択 UI が展開
- 走行記録は半透明（opacity: 0.4）で予定ルートの下に表示
- 詳細は SPEC_NAVIGATION.md 参照

関連: F-ROUTE-POLY, F-GPS-LOG

---

### F-KML: KMLエクスポート（1-6後追加で実装）

概要: 走行記録を Google Earth が読める KML 形式でエクスポートする。

仕様:
- Document > Folder 構成: 予定ルート / 実走ルート / ウェイポイント
- KML色は AABBGGRR 形式（Google Earth 仕様）
- simplifiedPath の座標を LineString に出力
- 詳細は SPEC_NAVIGATION.md 参照

関連: F-GPS-LOG, F-TRAVEL-VIEW

---

### F-HISTORY: 履歴・Undo/Redo（未実装・要検討）

概要: ルート編集のスナップショット履歴を管理し、Undo/Redo を可能にする。

仕様:
- スナップショット履歴方式: 自動保存のたびにルート全体を履歴に追加
- ↶（戻す）↷（進む）ボタンで履歴を閲覧
- 「この時点から再開」で明示的に編集再開
- フェーズ1: 1ルートあたり最大50バージョン
- フェーズ2: BEFORE UPDATE トリガーで全履歴退避
- 詳細は CLAUDE.md「要検討: ルート編集の履歴・Undo/Redo 機能」を参照

関連: F-ROUTE-SAVE

---

### F-MOBILE: モバイルUI（1-7で実装）

概要: モバイル端末向けにボトムシートUIを提供する。

仕様:
- 768px未満でモバイルレイアウトに切替
- 地図フルスクリーン + ボトムシート
- ボトムシート3段階: full=5%, half=50%, min=85%（画面上部からの位置）
- framer-motion でドラッグ制御
- サイドバーの内容がボトムシート内に移動

関連: F-MAP, F-TOP

---

### F-SPIDER: クモの巣走破地図（Phase2で実装）

概要: 過去の全走行記録を日本地図に重ねて表示する。

仕様:
- deck.gl PathLayer + Google Maps Overlay（WebGL GPU描画）
- ズームレベル別 LOD（Level of Detail）+ タイル化
- 性能要件: 300万点以上を 60fps で描画
- 表示: 走った道=インディゴ、複数回=太く/濃く
- フィルタ: 期間別、ルート別
- 統計: 総走行距離、都道府県走破率
- 詳細は SPEC_NAVIGATION.md 参照

関連: F-GPS-LOG, F-TRAVEL-VIEW

---

### F-AUTH: 認証・アカウント管理（Phase2で実装）

概要: ユーザー認証とアカウント管理。localStorage からクラウド同期への移行。

仕様:
- 認証方式: Google OAuth 2.0 を前提として検討中（strategy/PERSONAL_APIKEY_STRATEGY.md で個人APIキー発行に Google アカウントが必須のため）。Phase 2 設計開始前に最終確定する
- ルートデータのクラウド同期
- 複数デバイス間でのデータ共有
- アカウント登録完了後に F-APIKEY の設定案内を表示（任意）

関連: F-SUBSCRIBE, F-APIKEY, F-SECURITY, D-021

---

### F-APIKEY: 個人APIキー設定（Phase2で実装）

概要: ユーザーが自分の Google Cloud API キーを FlexRoute に設定し、個人の無料枠で利用できるようにする。

仕様:
- 設定画面に「自分の API キーを使う」オプションを用意
- 「Google Cloud を開く」ボタンでクイックセットアップURL（https://console.cloud.google.com/google/maps-apis/start）に遷移
- 戻ってきたらキーを貼り付け、「キーを検証して保存」で動作チェック
- 検証: Maps JavaScript API を1回呼んで成功するか確認
- キーは FlexRoute のアカウント情報に保存（Phase 2 サーバー）
- 無料枠超過防止: ローカルカウンタ + Cloud Monitoring API 同期（詳細は strategy/PERSONAL_APIKEY_STRATEGY.md）
- 段階的制限: 70%で警告バナー、80%で高コストAPI停止（地図表示と閲覧は継続）

前提: F-AUTH
入力: ユーザーが Google Cloud Console で発行した API キー
出力: FlexRoute が個人キーで動作。APIコスト = ¥0
エラー: キー検証失敗 → エラーメッセージ + 再入力案内
関連: F-AUTH, F-SECURITY, D-021

---

### F-SUBSCRIBE: サブスクリプション課金（Phase2で実装）

概要: Stripe を使ったサブスクリプション課金。

仕様:
- 課金プラン: 未確定
- Stripe 統合
- 無料/有料機能の分離

関連: F-AUTH

---

### F-GEMINI: Gemini API 自然言語検索（Phase2で検討）

概要: Gemini API を使った自然言語での場所検索とエビデンス提示。

実装状態: 未実装
マイルストーン: フェーズ2（検討）

備考:
- 旧コード（SmartNavi）の仕様書に含まれていたが、Google Places API の検索で十分な場面が多いため、必要性を見極めた上でフェーズ2で実装を検討する

関連: F-WP-SEARCH

---

### F-SIM: SensorBridge（センサーシミュレーション）

概要: ナビゲーション機能の開発・テスト用に、デバイスセンサーの値をシミュレートする。browser API をパッチし、PG のコードに痕跡を残さない設計（D-029）。

実装状態: Geolocation API パッチ実装済み。他のセンサーは型定義のみ。

#### 実装済み

- simGeolocation.ts: navigator.geolocation の watchPosition / getCurrentPosition / clearWatch をパッチ
- sensorStore: チャンネル別 real/sim モード管理 + sim 値保持
- simChannel.ts: BroadcastChannel でリモコンポップアップと通信
- sim-remote.html: リモコン UI（Position D-pad、Heading 円形ダイヤル、Speed/Accuracy/Interval スライダー、Denied チェック、Callback mode）
- SimButton.tsx: ?debug=1 で SIM ボタン表示、ポップアップ open/close 管理
- SimPositionCross.tsx: sim 座標の青十字マーカー（sensorStore 直接参照）

#### sim チャンネル一覧

| チャンネル | Browser API | パッチ型 | 実装状態 |
|---|---|---|---|
| position | Geolocation API | Watch | ✅ 実装済み |
| heading (GPS) | Geolocation API | Watch | ✅ 実装済み |
| speed | Geolocation API | Watch | ✅ 実装済み |
| magneticHeading | DeviceOrientation API | Event | 型のみ（F-DEVICE-ORIENT） |
| network | Network Information API | Event+Property | 型のみ |
| battery | Battery Status API | Request | 型のみ |
| screenOrientation | Screen Orientation API | Event | 型のみ |
| wakeLock | Wake Lock API | Request | 型のみ（F-WAKELOCK） |
| visibility | Page Visibility API | Event+Property | 型のみ |
| deviceMotion | DeviceMotion API | Event | 型のみ |
| vibration | Vibration API | Request | 型のみ |
| ambientLight | Ambient Light Sensor | Event | 型のみ |

#### 設計原則

D-029 参照。sim は browser API パッチ方式。PG は sim の存在を知らない。

関連: D-029, D-030, D-031, D-032, F-NAV, F-DEVICE-ORIENT, F-WAKELOCK

---

### F-WAKELOCK: 画面消灯防止（Wake Lock API）

概要: ナビゲーション中にスマートフォンの画面が消灯しないようにする。バイク走行中に画面が消えるのを防止。

実装状態: 未実装。sensor.ts に型定義のみ。

仕様:
- ナビゲーション開始時に navigator.wakeLock.request('screen') を呼び出し
- ナビ終了時に release()
- visibilitychange で復帰時に再取得（ブラウザがバックグラウンドで自動 release するため）
- 低バッテリー等で OS が拒否した場合は警告表示
- sim パッチ: simWakeLock.ts で request() の成否を制御（Request 型）

実装タイミング: F-NAV Step 6（仕上げ）で実装。ナビ画面の基本動作（Step 1〜5）が安定した段階

関連: F-NAV, F-SIM, D-029

---

### F-DEVICE-ORIENT: 磁気センサー heading（DeviceOrientation API）

概要: DeviceOrientationEvent.alpha から磁気センサーの方位を取得し、GPS heading と融合する。静止中でも方位がわかるようにする。

実装状態: 未実装。useHeadingFusion.ts にスケルトンと設計コメントのみ。sensor.ts に型定義のみ。

仕様:
- useHeadingFusion 内で DeviceOrientationEvent を addEventListener
- GPS heading（移動中に正確）と磁気 heading（静止中も動作）を speed に応じて融合（D-031）
- sim パッチ: simDeviceOrientation.ts で addEventListener をパッチし fake event を dispatch（Event 型）
- リモコン UI: Heading セクションとは別に Magnetic Heading セクションを追加。リアルタイム反映

実装タイミング: ナビの実走テストで静止時の方位が必要になった段階

関連: F-NAV, F-SIM, D-029, D-031

---

## 検討中のUI改善案

以下はチャットで議論され「後で実装」と決定した改善案。
実装タイミングは未定だが、設計検討時の参考として記録する。

### UI-IDEA-001: 検索モーダル内「地図をタップして追加」ボタン

- **概要**: 検索モーダルに「地図をタップして追加」ボタンを設ける
- **動作**: ボタンタップ → モーダルを閉じて地図タップモードに入る → タップ後に insertIndex の位置にウェイポイントを挿入
- **想定タイミング**: 1-5 or 1-6
- **理由**: 検索だけでなく地図を見ながら追加したいケースがある

### F-THEME: カラーテーマ切替（未定で実装）

概要: 複数の色調プリセットから選択し、アプリ全体のカラースキームを切り替える。

仕様:
- 複数のカラープリセット（インディゴ、エメラルド、スレート等）を用意
- 設定画面またはヘッダーから切替
- 選択はlocalStorageに保存
- Tailwind CSS のカスタムプロパティで実装

関連: なし

---

### F-I18N: 多言語対応（Phase2で実装）

概要: react-i18next を使用し、UIテキストを多言語対応する。

仕様:
- コード内の日本語ハードコードをキー参照に置き換える
- 翻訳ファイルは locales/ja.json, locales/en.json 等に配置
- ブラウザの言語設定に応じた自動切替 + 設定画面からの手動切替
- 選択言語は localStorage に保存

言語優先順位:
- Tier 1（必須・Phase2初期）: 日本語、英語
- Tier 2（早期追加）: ドイツ語、フランス語、イタリア語、スペイン語
- Tier 3（成長市場）: ポルトガル語、タイ語、ヒンディー語、韓国語

優先順位の根拠: オートバイツーリングのレクリエーション市場規模。北米・欧州が市場の70%超を占め、インド（CAGR 13.5%）が最も高い成長率。

関連: なし

---

### F-SECURITY: セキュリティ対策（Phase2で実装）

概要: OWASP Top 10 を準拠基準とし、Webアプリケーションのセキュリティ対策を実施する。

仕様:
- OWASP Top 10（最新版）の全項目に対して対策を設計・実装する
- 認証方式の選定（自前実装 vs Auth0/Supabase Auth 等の外部サービス）
- HTTPS 必須、セッション管理、CORS設定、CSP ヘッダー
- 依存パッケージの脆弱性管理（npm audit 定期実行）
- 不正アクセスのログ・監視の仕組み

意思決定タイミング:
- **フェーズ2の設計開始前（DB・認証の設計に着手する前）に、認証方式とセキュリティ対策の意思決定を行うこと**
- 自前で認証を実装するのはセキュリティリスクが高いため、外部サービスの利用を推奨
- 決定事項は docs/DECISIONS.md に記録する

フェーズ1（現在）の対策:
- Google Maps API キーに HTTP リファラ制限を設定（本番URLのみ許可）
- npm audit による依存パッケージの脆弱性チェック

関連: F-AUTH

---

### F-TEST: テスト自動化（1-5で基盤セットアップ、段階的に拡充）

概要: 自動テストによるリグレッション検知。コード変更時に既存機能が壊れていないことを自動検証する。

テスト種別と導入タイミング:

| 種別 | ツール | 対象 | 導入時期 |
|---|---|---|---|
| ユニットテスト | Vitest | utils, Store ロジック, Service | 1-5（基盤）、整理セッションで追加 |
| コンポーネントテスト | React Testing Library | UIコンポーネントの振る舞い | 整理セッションで追加 |
| E2Eテスト | Playwright | ユーザー操作シナリオ全体 | Phase2 |

テスト方針:
- 探索セッションではテストを書かない（コードが激しく変わるため）
- 整理セッションでコードが安定したタイミングでテストを追加する
- 認証・課金（Phase2）はTDD（テスト駆動開発）で進める
- PRごとに GitHub Actions で全テスト自動実行し、失敗時はマージをブロックする

Google Maps API 依存部分の方針:
- 地図表示、Place検索、ルート計算はテスト時にモック（偽のレスポンス）で代替する
- モックの設計はPhase1後半（1-6 ナビゲーション）で行う

リグレッションテスト優先対象:
- F-NAV Step 6（仕上げ）のタイミングで、変更頻度が高くリグレッションが実際に発生したコードから優先的にテストを書く
- 対象: NavCameraSync / cameraController（カメラ制御）、edgeFollow（エッジ追従）、useStepProgression（ステップ通過判定）
- テスト内容: 特定の入力（followMode, headingMode, position 等）に対する moveCamera 呼び出しの検証

関連: F-SECURITY

---

### UI-IDEA-002: 地図タップ時のウェイポイント名入力ダイアログ

- **概要**: 地図面タップ（座標ベース）でウェイポイント追加する際、座標表示の代わりにユーザーが名前を入力できるダイアログを表示
- **動作**: 地図タップ → 小さな入力ダイアログ表示 → 名前入力（任意）→ ウェイポイント追加
- **想定タイミング**: 1-4 or 1-5
- **理由**: 座標表示（35.681, 139.767）はユーザーにとってわかりにくい

## 既知の問題（TODO）

| 問題 | 発見時期 | 関連機能 | 状態 |
|---|---|---|---|
| ~~現在地マーカーが表示されない + 初期表示で現在位置に移動しない（useGeolocation が高精度のみで watchPosition しており、デスクトップで失敗する。2系統並走設計で解決予定）~~ | 1-5 | F-LOC | ✅ D-020: ルート編集画面からGPS除去。ナビ画面（1-6）でのみ使用する設計に変更 |
| ~~ルートロード時にポリラインの一部が画面からはみ出す（fitBoundsのpadding不足）~~ | 1-5 | F-ROUTE-LOAD, MapInitialView | ✅ サイドバー幅を考慮した左右非対称padding（1-5）で解決済み |
| ~~ルート削除後のカード再表示にスライドアニメーションがない（ぱっと消えると削除できたか分かりにくい）~~ | 1-5 | F-ROUTE-DELETE, RouteCard | ✅ AnimatePresence + motion.div（1-5）で解決済み |
| ~~ウェイポイント追加時にGoogleデフォルトのポップアップが表示される~~ | 1-5 | F-WP-ADD | ✅ PlaceActionModal（1-5）で解決済み |
| 林道・峠道でRoutes APIが直進と判断した分岐では案内指示が生成されず、ターン接近ズームが発動しない（D-025） | 1-6設計 | F-NAV | 未対策（課題記録済み） |
| ~~デスクトップPCでナビ開始時にGPSロストアイコン（赤い丸）が常時表示される（固定15秒閾値がWifi/IP更新間隔より短い）~~ | 1-6 Step1 | F-LOC, F-NAV | ✅ D-028: 適応的lost閾値で解決 |
| ~~routeStore.ts が 177 行で 150 行ルール超過（F-LOG v2 のログ追加によるブロック化が原因。整理セッションで分割予定）~~ | 1-6 | F-LOG | ✅ v1.6.71: routeStorePersistence.ts に永続化アクションを分離（177→123行） |
| html2canvas が Google Maps タイル（CORS）でスクリーンショット取得に失敗する（ログデータは正常回収） | 1-6 | F-BUGREPORT | 既知の制約（D-034） |
| Routes API v2 の 25 ウェイポイント上限が未強制（ユーザーが 25 件超を追加してもエラーにならない） | 1-6設計 | F-ROUTE-CALC | 未対処 |
| エッジ追従: 斜め接近時にマーカーがエッジ沿いに徐々にずれる | 1-6 | F-NAV | 留置（v1.6.87 で軽減したが完全解消せず。getBounds の近似誤差に起因） |
| エッジ追従: headingUp で上方向に進むとマーカーが画面外に出る場合がある | 1-6 | F-NAV | 留置（getBounds が heading 回転を考慮しない。EDGE_MARGIN_PX=120 で軽減。Phase 2 でピクセル座標判定を検討） |

## 再現困難な不具合

確認されたが再現手順が確定しておらず、修正に着手できない不具合を記録する。
再現手順が確定した場合は「既知の問題（TODO）」に移動する。

### SPORADIC-001: P モードでホイールズームが突然効かなくなる

- 発見バージョン: v1.6.64
- 症状: P モードでホイールズームが突然反応しなくなる。N に切り替えると効く。P に戻しても効かない。ページリロードで復旧
- 発生条件: followMode=auto のまま P/N 切替 + ホイール + +/- ボタンを繰り返し操作中に発生
- 再現手順: 未確定（繰り返し操作中に散発的に発生）
- 推定原因: scrollwheel 設定または handleWheel リスナー登録の競合が疑われるが未確定
- 関連: F-ZOOM, D-035
- 対処: v1.6.66 で scrollwheel 設定を一元化。v1.6.92 で CameraController に wheelMode を内部状態化し window.__wheelMode / wheelmode-changed イベントを廃止（D-037）。修正後の再現テストでは発生せず

## MD反映待ちドラフト

探索セッションで決まった要件・仕様変更のうち、まだ正式なMDセクションに反映されていないものを記録する。
整理セッション時にこのリストを確認し、該当する MD の正式セクションに移す。移し終わった項目は削除する。

### 反映先: SPEC_FEATURES.md
- CameraController 10 モード比較実験中（v1.6.94〜v1.6.98）。ORG / SETTER / SET+PAN / MOVE / MOVE+TW の各 v1 と heading-master 方式の v2。MOVE+TW2 で回転中マーカー振り回しが完全解消（SETTER2 / SET+PAN2 は heading_changed の発火頻度不足で不十分）。モード確定後に F-ZOOM セクションを更新する
- P/N ホイールモードトグル廃止（v1.6.94）。pivot モード固定
- CameraModeSelector コンポーネント追加（実験用 UI。地図左下に 10 モード切替ボタン）

### 反映先: SPEC_SCREENS.md
（なし）

### 反映先: SPEC_DATA.md
- cameraController ディレクトリ構成更新: index.ts + modeOrg.ts / modeSetter.ts / modeSetterPan.ts / modeMoveCamera.ts / modeMoveCameraTw.ts + 各 v2 + utils.ts。全 12 ファイル
- utils.ts に calcRotationPivotCenter, deriveCenter 追加
- CameraMode インターフェースに onDragStart 追加（v1.6.97）
- NavWheelZoom 削除済み（v1.6.93 で CameraController に吸収）
- useAutoZoom 削除済み（v1.6.93 で CameraController に吸収）
- CameraModeSelector コンポーネント追加（v1.6.94）

### 反映先: DESIGN_REFERENCE.md
（なし）

### 反映先: SPEC_NAVIGATION.md
（なし）

### 反映先: CLAUDE.md
- 用語変更予定: followMode の "auto" → "follow" にリネーム（モード確定後の整理セッションで実施）

### 反映先: DECISIONS.md
- D-038（Google Maps API 依存の段階的抽象化方針）新規追加
- D-039（heading-master / center-slave カメラ制御方式）新規追加
- D-040（setHeading にはアニメーションがある — D-032 改訂）新規追加
