# FlexRoute 機能仕様書

> 最終更新: 2026-03-11

## 機能一覧

| ID | 機能 | 実装状態 | MS |
|----|------|---------|-----|
| F-MAP | 地図表示 | ✅ | 1-2 |
| F-LOC | 現在地表示（2段階測位） | ✅ | 1-2, 1-4 |
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
| F-LOG | LogService/UserActionTracker/PerformanceMonitor | ✅ | - |
| F-SOURCEMAP | Source Map（本番ビルドでもデバッグ可能） | ✅ | - |
| F-CACHE | キャッシュ対策（F5リロード） | ✅ | - |
| F-PLACE-MODAL | PlaceActionModal（施設写真・ラベル・ナビ開始） | 未実装 | 1-5 |
| F-LABEL | ラベル管理（CRUD） | 未実装 | 1-5 |
| F-PLACE-SAVE | 場所保存・一覧 | 未実装 | 1-5 |
| F-THUMB | ルートサムネイル（Static Maps API） | 未実装 | 1-5 |
| F-NAV | ナビゲーション（GPS追従・案内） | 未実装 | 1-6 |
| F-NAV-WIPE | ワイプマップ（PiP） | 未実装 | 1-6 |
| F-NAV-REROUTE | 逸脱検知・リルート（3選択肢） | 未実装 | 1-6 |
| F-GPS-LOG | GPS走行記録（ナビ中+常時） | 未実装 | 1-6 |
| F-TRAVEL-VIEW | 走行記録画面（一覧・選択・表示） | 未実装 | 1-6後 |
| F-LAYER | 表示レイヤー切替 | 未実装 | 1-6後 |
| F-KML | KMLエクスポート | 未実装 | 1-6後 |
| F-HISTORY | 履歴・Undo/Redo | 未実装・要検討 | 未定 |
| F-MOBILE | モバイルUI（ボトムシート） | 未実装 | 1-7 |
| F-SPIDER | クモの巣走破地図（deck.gl） | 未実装 | Phase2 |
| F-AUTH | 認証・アカウント管理 | 未実装 | Phase2 |
| F-SUBSCRIBE | サブスクリプション課金（Stripe） | 未実装 | Phase2 |
| F-GEMINI | Gemini API 自然言語検索 | 未実装 | Phase2（検討） |
| F-THEME | カラーテーマ切替（プリセット選択） | 未実装 | 未定 |
| F-I18N | 多言語対応（i18n） | 未実装 | Phase2 |
| F-SECURITY | セキュリティ対策（OWASP Top 10準拠） | 未実装 | Phase2 |
| F-TEST | テスト自動化（Vitest + Playwright） | 基盤のみ | 1-5 |

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

### F-LOC: 現在地表示（2段階測位）

概要: GPS/WiFi で現在地を取得し、青い矢印マーカーで常時表示する。2段階測位で即時表示。

動作フロー:
- useGeolocation フックが navigator.geolocation.watchPosition を開始
- 位置取得 → navigationStore.setCurrentPosition(position, heading, speed)
- CurrentLocationMarker が AdvancedMarker + カスタムSVG矢印で描画（ZIndex=100、常時最上位）
- heading に応じて矢印が回転（transition: 0.3s ease-out）
- ルート編集画面でウェイポイントなしの場合:
  1. キャッシュ確認: navigationStore.currentPosition があれば即使用
  2. 段階1: enableHighAccuracy: false（WiFi/IP、タイムアウト2秒）→ 即座に地図表示
  3. 段階2: enableHighAccuracy: true（GPS）→ バックグラウンド実行、取得後 panTo
  4. 段階1も失敗 → 東京（35.6895, 139.6917）をデフォルト表示
- ローディング画面は使用しない。地図は必ず即座に描画する

入力: Geolocation API の watchPosition
出力: 地図上に青い矢印マーカー。navigationStore に現在地・方向・速度を保持
エラー: 位置取得拒否/失敗 → 東京をデフォルト表示。エラーログ出力
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
- 「ラベル」タブ: 「準備中」表示（1-5で実装）
- 「場所」タブ: 「準備中」表示（1-5で実装）
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

### F-LOG: LogService / UserActionTracker / PerformanceMonitor

概要: アプリケーションログ、ユーザー操作ログ、パフォーマンス計測を統合管理する。

動作フロー:
- logService: カテゴリ別ログ出力（debug/info/warn/error）
- userActionTracker: ユーザー操作の追跡（ADD_WAYPOINT, REMOVE_WAYPOINT, SET_VIEW_MODE 等）
- performanceMonitor: API 応答時間、レンダリング時間の計測
- 全ログは LogEntry 型で統一。開発時はコンソール出力

### LogService のレベル制御
- 開発モード: 全レベル（debug, info, warn, error）を console に出力 + メモリに保持
- 本番モード: warn と error のみメモリに保持。debug と info は破棄
- メモリ上のリングバッファ: 最大500件
- PerformanceMonitor: 閾値超え（例: API呼び出し5秒以上）は warn レベルで記録

### Source Map
- vite.config.ts で build.sourcemap: true を設定済み
- 本番ビルドでもブラウザの Sources タブで元の TypeScript ソースが表示される
- ブレークポイント設置、Watch パネルでの変数監視が可能

入力: 各サービス・コンポーネントからの呼び出し
出力: コンソールログ出力
エラー: —
関連: F-ERROR

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

関連: F-PLACE-MODAL, F-PLACE-SAVE

---

### F-PLACE-SAVE: 場所保存・一覧（1-5で実装）

概要: お気に入りの場所を保存し、一覧表示する。

仕様:
- 場所の保存（Place情報 + ユーザーメモ + ラベル）
- TOP画面の「場所」タブに一覧表示
- 保存済み場所からウェイポイントに追加可能

関連: F-PLACE-MODAL, F-LABEL

---

### F-THUMB: ルートサムネイル（1-5で実装）

概要: ルート一覧のカードにルートのサムネイル画像を表示する。

動作フロー:
- Static Maps API でサムネイルURLを生成
- 生成したURLを SavedRoute.thumbnailUrl にキャッシュする
- ルート変更時（version変更時）のみ再生成する
- RouteCard マウント時に毎回再生成してはならない（アンチパターン禁止1）
- ポリラインが長い場合は Douglas-Peucker で簡略化してURL長を削減してよい
  （この用途でのポリライン簡略化は許可。禁止されているのは「毎回のマウント時の再生成」）
- RouteCard のヘッダー部分に表示

関連: F-ROUTE-LIST

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
- 逸脱判定閾値: 50m
- 3選択肢: 逸脱地点に戻る / 次の経由地までリルート（デフォルト） / 目的地までリルート
- StepPassage でステップ通過を管理
- ポリラインデザイン: 通過済み=opacity 0.3、未通過=元の色、リルート=グレー破線
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
- 認証方式: 未確定（OAuth / メール+パスワード）
- ルートデータのクラウド同期
- 複数デバイス間でのデータ共有

関連: F-SUBSCRIBE

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
| 地図初期表示が東京→現在位置に切り替わる（2段階測位の挙動） | 1-5 | F-LOC, MapInitialView | 未対処 |
| ウェイポイント追加時にGoogleデフォルトのポップアップが表示される | 1-5 | F-WP-ADD, PlaceActionModal | 判断保留 |

## MD反映待ちドラフト

探索セッションで決まった要件・仕様変更のうち、まだ正式なMDセクションに反映されていないものを記録する。
整理セッション時にこのリストを確認し、該当する MD の正式セクションに移す。移し終わった項目は削除する。

### 反映先: SPEC_FEATURES.md
（なし）

### 反映先: SPEC_SCREENS.md
（なし）

### 反映先: SPEC_DATA.md
（なし）

### 反映先: DESIGN_REFERENCE.md
（なし）

### 反映先: SPEC_NAVIGATION.md
（なし）

### 反映先: CLAUDE.md
（なし）

### 反映先: DECISIONS.md
（なし）
