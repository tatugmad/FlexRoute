# FlexRoute

> 最終更新: 2026-03-11

## ドキュメント体系

本プロジェクトの仕様は以下のドキュメント群で管理する。
開発時は全ドキュメントを参照すること。

| ドキュメント | 内容 |
|---|---|
| CLAUDE.md | 開発ルール・設計原則・技術スタック・アンチパターン |
| docs/DESIGN_REFERENCE.md | UIデザイン資産（SVG、コンポーネントスタイル） |
| docs/SPEC_SCREENS.md | 全画面の操作仕様・画面遷移図 |
| docs/SPEC_DATA.md | データモデル・保存方式・API連携仕様 |
| docs/SPEC_NAVIGATION.md | ナビゲーション・GPS・リルート詳細仕様 |
| docs/SPEC_FEATURES.md | 機能一覧と各機能の動作定義 |
| docs/DECISIONS.md | 設計判断の記録（なぜこうしたか） |

## 開発フロー

### 開発環境
- Claude Code Web（https://claude.ai/code）でリモート開発
- GitHub リポジトリ: tatugmad/FlexRoute（Public）
- デプロイ先: https://tatugmad.github.io/FlexRoute/
- ローカル開発: Node.js 20 + npm run dev（localhost で即時確認可能）

#### ローカル開発セットアップ（Windows）
1. `git clone https://github.com/tatugmad/FlexRoute.git && cd FlexRoute`
2. `scripts\setup.bat` を実行（npm install + .env テンプレート作成）
3. `.env` に Google Maps API キーと Map ID を記入
4. `scripts\dev.bat` で開発サーバー起動 → http://localhost:5173/FlexRoute/
5. スマホ確認: `scripts\dev-mobile.bat` → Network URL にアクセス

#### scripts/ フォルダ
| ファイル | 用途 |
|---|---|
| setup.bat | 初期セットアップ（npm install + .env作成） |
| dev.bat | 開発サーバー起動 |
| dev-mobile.bat | LAN公開で起動（スマホ確認用） |
| sync-main.bat | mainブランチに切替 + 最新取得 |
| switch-branch.bat | リモートブランチ一覧 → 選んで切替 |
| build-check.bat | ビルドが通るか確認 |

### 開発サイクル
1. Claude Code Web の左上入力欄で新しいセッション（新ブランチ）を開始
2. タスクを指示 → Claude Code がコード生成・ブランチにコミット
3. ローカルで `scripts\switch-branch.bat` → ブランチに切替 → localhost で即時確認
4. 修正が必要なら同じセッション内（右下入力欄）で追加指示 → 3に戻る
5. 完成度が十分になったら Create PR → GitHub で Merge → Delete branch
6. `scripts\sync-main.bat` で main に戻る

### タスク指示の原則
- 1タスク = 1セッション（複数機能を同時に指示しない）
- マイルストーン単位で進める
- バグ修正は「このエラーが出ている。直せ」だけで十分。原因推測は不要
- CLAUDE.md と docs/ のドキュメントを必ず参照するよう指示に含める

### セッション運用

#### 2種類のセッション

| 種類 | 目的 | コード品質 | MD更新 |
|---|---|---|---|
| 探索セッション | デザイン・動きを試す | 二の次（動作優先） | 不要 |
| 整理セッション | 要件確定後にコードを再構成 | 設計原則を厳守 | 必須 |

探索セッションを3〜4回行ったら、整理セッションを1回入れる。

#### 整理セッションの発動基準

以下のいずれかに該当したら整理セッションを入れる:
- 1ファイルが150行を超えた
- Store に仮置きの状態が3つ以上ある
- 同じデータを2箇所で持っている
- コンポーネントの props が5つを超えた
- 型定義が types/ 以外に書かれている

#### 探索セッション指示文の必須フッター

探索セッションの指示文末尾には、必ず以下を含める:

```
## 完了後の報告
以下を報告せよ:
1. 変更・追加したファイル一覧
2. 150行を超えたファイルがあるか
3. 型定義が types/ 以外に書かれていないか
4. 1つのコンポーネントに複数の責務が混在していないか
```

#### 役割分担

- **Claude Code Web**: 探索セッション完了時に上記報告を出力
- **チャットAI**: 報告を見て整理セッションの要否を判断し、指示文を作成
- **ユーザー**: 結果をチャットに貼り、指示文を Claude Code Web に渡す

### チャット引き継ぎ
- 設計相談・方針決定は claude.ai のチャットで行う
- チャットで確定した設計判断は必ず docs/DECISIONS.md に記録する
- 新しいチャットを開始する際は以下を伝える:
  「FlexRouteプロジェクトの開発を続ける。
   CLAUDE.md と docs/ 以下のドキュメント体系に全仕様が記載されている。」
- 簡単なタスク（バグ修正、小規模機能追加）はチャット不要。Claude Code Web に直接指示

### ドキュメント更新ルール
- チャットで設計判断が確定するたびに、該当する MD に反映する
- チャット終了前に未反映の決定がないか確認する
- 合言葉:「明日別のAIに引き継いで、スクラッチで同じものが制作できるMD」

#### ドキュメント責務分離（何をどこに書くか）
| ドキュメント | 書くもの | 書かないもの |
|---|---|---|
| CLAUDE.md | 開発ルール・設計原則・アンチパターン | 個別機能の詳細仕様 |
| docs/SPEC_FEATURES.md | 各機能の動作フロー・入出力・エラー | UIの見た目・データ構造 |
| docs/SPEC_SCREENS.md | 画面構成・操作仕様・遷移図 | ビジネスロジック |
| docs/SPEC_DATA.md | 型定義・Store・Service・API連携 | 画面レイアウト |
| docs/SPEC_NAVIGATION.md | ナビ・GPS・リルート・走行記録 | ナビ以外の機能 |
| docs/DESIGN_REFERENCE.md | SVGアイコン・コンポーネントスタイル | 動作ロジック |
| docs/DECISIONS.md | 設計判断の理由と却下案 | 実装詳細 |

#### ドキュメント更新時の整合性チェック
機能の実装・仕様変更時に、以下を必ず確認する:
1. 新規追加した型・Store・Serviceが SPEC_DATA.md に記載されているか
2. 関連する SPEC_FEATURES.md の機能IDから参照されているか
3. 画面に変更があれば SPEC_SCREENS.md が更新されているか
4. 「未実装」「準備中」「X-Xで実装予定」「TODO」の記述が実装完了後に残っていないか
5. 実装タイミング一覧（CLAUDE.md末尾）が最新か

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
- placeId は string | null のいずれかとする。undefined を許さない
- placeId が空文字列の場合は null に正規化する
- addWaypoint で座標バリデーション（NaN, Infinity, (0,0) を拒否）を必ず実行する

### PlaceData の扱い
- ウェイポイントはGoogleのPlace情報をベースに、
  FlexRoute固有の情報（ユーザーメモ、順番等）を追加で保持する
- placeData はオプショナル。Placeアイコン経由の場合のみ存在する
- フェーズ2でDB保存する際は placeData も JSONB に含める

## ナビゲーション詳細仕様

ルートデータの保存構造、逸脱検知・リルート、ステップ通過管理の詳細仕様。

詳細は docs/SPEC_NAVIGATION.md を参照。

## GPSログ・走行記録仕様

GPSログの記録方針、データ構造（GpsLog, TravelPoint）、間引きアルゴリズムの仕様。

詳細は docs/SPEC_NAVIGATION.md を参照。

## 走行記録画面

走行記録の一覧表示・フィルタ・複数選択・地図重畳表示の画面仕様。

詳細は docs/SPEC_NAVIGATION.md を参照。

## ルート編集画面の表示レイヤー

ルート編集画面での予定ルート・ウェイポイント・走行記録の表示切替パネル仕様。

詳細は docs/SPEC_NAVIGATION.md を参照。

## KMLエクスポート仕様

走行記録をKMLファイルに出力する機能。予定ルート・実走ルート・ウェイポイントを構造化出力。

詳細は docs/SPEC_NAVIGATION.md を参照。

## クモの巣走破地図仕様

過去の全走行記録を日本地図に重ねて表示する機能（フェーズ2実装）。deck.gl + LOD + タイル化。

詳細は docs/SPEC_NAVIGATION.md を参照。

## 要検討: ルート編集の履歴・Undo/Redo 機能

### 背景
ルートの自動保存において、ユーザーが編集中にウェイポイントを全削除した場合や、
過去の状態に戻したい場合に、データの安全性と操作性を両立する仕組みが必要。

### 検討中の設計方針: スナップショット履歴方式
- 自動保存のたびにルート全体（waypoints, legs, name 等）をスナップショットとして履歴に追加
- ウェイポイントやstepsを個別にバージョン管理しない（JSONB集約のスナップショット単位）
- ルート編集画面に ↶（戻す）↷（進む）ボタンを設け、履歴を遡って呼び出せる
- ↶↷ は「閲覧モード」であり、押しただけでは履歴を削除しない
- 「この時点から再開」を明示的に選択した場合のみ、それ以降の履歴を削除して新しい編集を開始
- 地図操作等で暗黙的に編集を開始する場合は確認ダイアログを表示

### データ構造案
```
SavedRoute {
  id: string
  createdAt: string
  current: RouteSnapshot
  history: RouteSnapshot[]
}

RouteSnapshot {
  version: number
  timestamp: string
  name: string
  waypoints: Waypoint[]
  encodedPolyline: string | null
  legs: SavedRouteLeg[] | null
}
```

### 容量管理
- フェーズ1（localStorage）: 1ルートあたり最大50バージョン。超過時は古いものから削除（v1は常に保持）
- フェーズ2（PostgreSQL）: BEFORE UPDATE トリガーで全履歴を history テーブルに退避。容量制限なし

### ステータス: 未実装・要検討
この機能はマイルストーン1-4以降で設計を確定し実装する予定。
現時点の1-4では、シンプルな自動保存（条件付き上書き）で暫定実装する。
履歴方式への移行を見据え、SavedRoute に version, createdAt, updatedAt を必ず含めること。

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
