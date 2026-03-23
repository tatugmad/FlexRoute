# FlexRoute

> 最終更新: 2026-03-22

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
| strategy/ | サービス企画戦略（APIコスト・収益化・競合分析・規約調査） |

## 開発フロー

### 開発環境
- CC Web（ブラウザ版 Claude Code）で開発
- GitHub リポジトリ: tatugmad/FlexRoute（Public）
- デプロイ先: https://tatugmad.github.io/FlexRoute/
- 動作確認は GitHub Pages で行う（ローカル開発環境は使用しない）

#### Geolocation テスト戦略

ブラウザの Geolocation API はセキュアコンテキスト（HTTPS）でのみ動作する。
GitHub Pages は HTTPS のため、Geolocation を含む全機能をテスト可能。

#### ローカル開発セットアップ（Windows）※オプション

ローカルで開発する場合のみ使用。通常は不要。

1. `git clone https://github.com/tatugmad/FlexRoute.git && cd FlexRoute`
2. `scripts\setup.bat` を実行（npm install + .env テンプレート作成）
3. `.env` に Google Maps API キーと Map ID を記入
4. `scripts\dev.bat` で開発サーバー起動

注意: `localhost` では Geolocation が動作するが、LAN IP（HTTP）では動作しない。

#### scripts/ フォルダ
| ファイル | 用途 |
|---|---|
| setup.bat | 初期セットアップ（npm install + .env作成） |
| dev.bat | 開発サーバー起動（LAN公開込み） |
| build-check.bat | ビルドが通るか確認 |

### APP_VERSION 運用ルール
- `src/constants/appVersion.ts` にバージョン番号を管理する
- バージョン体系: `{マイルストーン}.{タスク連番}`（例: `1.5.3` = MS 1-5 の3番目のタスク）
- CC Web への全てのタスク指示に次のバージョン番号を含める
- CC Web はタスク実行時に `APP_VERSION` を指示されたバージョンに更新する
- TOP画面ヘッダーに `v{APP_VERSION} ({branch}@{commitHash})` 形式で表示する
- マイルストーンが変わったら第2セグメントをリセット（例: 1.5.x → 1.6.1）
- 完了報告で更新後のバージョン番号を必ず明記すること
- sim-remote.html の SIM_VERSION も APP_VERSION と同じ値に更新すること（バージョン不一致警告の正常動作に必要）

### 開発サイクル
1. チャット（claude.ai）で設計を固める
2. CC Web に指示 → CC Web がコード編集・ブランチ作成・コミット・PR作成を実行
3. GitHub で PR を Merge
4. GitHub Pages（https://tatugmad.github.io/FlexRoute/）で動作確認
5. 問題があればチャットで修正方針を決め → 2に戻る

### CC Web ブランチ・PR運用ルール

#### ブランチ運用
- 新しいタスクは必ず main の最新から新ブランチを作成する
- CC Web はブランチ名に `claude/` プレフィックスとセッションIDサフィックスが必須（push権限の制約）
  - CC Web が自動生成する命名をそのまま使用すること
  - `feature/xxx` や `docs/xxx` のような任意の命名は push できない
- マージ済みのブランチに追加コミットしてはならない（PRが「作成」ではなく「表示」になり、マージできなくなる）

#### コミット前のブランチ状態チェック

コミットする前に、現在のブランチが main にマージ済みかを確認する。
マージ済みの場合は、main の最新から新ブランチを作成してから作業を開始すること。

#### PR作成
- PR は CC Web の UI に表示される「PR作成」ボタンで作成する
- gh CLI のインストールや GitHub API の直接呼び出しは行わない（CC Web 環境では利用できない）
- 「PR作成」ボタンが表示されず「PRを表示」になっている場合、マージ済みブランチにコミットしてしまった可能性がある。新ブランチを作り直すこと

#### 環境の自己認識
- CC Web はサンドボックス環境で動作しており、ローカルファイルシステムではない
- npm run dev によるローカルサーバー起動・localhost での確認は行わない
- 動作確認は GitHub Pages（https://tatugmad.github.io/FlexRoute/）で行う

### タスク指示の原則
- 1タスク = 1セッション（複数機能を同時に指示しない）
- マイルストーン単位で進める
- バグ修正は「このエラーが出ている。直せ」だけで十分。原因推測は不要
- CLAUDE.md と docs/ のドキュメントを必ず参照するよう指示に含める

### CC Web 指示ファイルの運用ルール
- 各指示ファイルの冒頭に「前回作業の記録」セクションを設け、前回のバージョン番号と完了内容を記載すること。CC Web はこの記録を元にドキュメントの整合性を保つ
- チャット側（claude.ai）はマージ報告を受けるまで次の指示ファイルを提示しない（マージ漏れ防止）

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
5. APP_VERSION: 更新後のバージョン番号を明記すること
```

#### 役割分担

- **Claude Code Web**: 探索セッション完了時に上記報告を出力
- **チャットAI**: 報告を見て整理セッションの要否を判断し、指示文を作成
- **ユーザー**: 結果をチャットに貼り、指示文を Claude Code Web に渡す

#### MD反映待ちドラフトの運用

- 探索セッション中にチャットで決まった要件・仕様変更は、SPEC_FEATURES.md 末尾の「MD反映待ちドラフト」に記録する
- ドラフトは反映先のドキュメントごとに分類して書く
- 整理セッション時に、ドラフトの内容を該当する正式セクションに移し、ドラフトから削除する
- ドラフトの記載粒度は「別のAIが読んで正式セクションに書ける程度」とする

### 不具合解析の原則
- 不具合報告に対して原因を推測で断定しない。まず FlightRecorder のログ提供を依頼する
- ログ提供の依頼手順:
  1. ?debug=1&log=trace でナビ開始し、不具合を再現する
  2. ブラウザコンソール（本体側）で __fr.dump() を実行し、結果を貼り付ける
  3. 特定カテゴリのみ必要な場合: __fr.dump().filter(e => e.category === 'SIM') のようにフィルタ
  4. sim-remote 側のコンソールエラーも確認する
- ログに基づいて原因を特定し、修正方針を決定する

### チャット引き継ぎ
- 設計相談・方針決定は claude.ai のチャットで行う
- チャットで確定した設計判断は必ず docs/DECISIONS.md に記録する
- 新しいチャットを開始する際は以下を伝える:
  「FlexRouteプロジェクトの開発を続ける。
   CLAUDE.md と docs/ 以下のドキュメント体系に全仕様が記載されている。」
- 簡単なタスク（バグ修正、小規模機能追加）はチャット不要。Claude Code Web に直接指示

#### チャット開始プロンプト（テンプレート）

新しいチャットを開始する際は、以下をコピーして貼り付ける:

---

FlexRouteプロジェクトの開発を続ける。
GitHub リポジトリ: tatugmad/FlexRoute（Public）
デプロイ先: https://tatugmad.github.io/FlexRoute/
CLAUDE.md と docs/ 以下のドキュメント体系に全仕様が記載されている。
docs/ には以下のドキュメントがある:
- DESIGN_REFERENCE.md（UIデザイン資産）
- SPEC_SCREENS.md（画面仕様・遷移図）
- SPEC_DATA.md（データモデル・API連携・Hooks/Services責務一覧）
- SPEC_NAVIGATION.md（ナビ・GPS・走行記録）
- SPEC_FEATURES.md（全機能の動作定義 + 既知の問題TODO）
- DECISIONS.md（設計判断の記録）
まず CLAUDE.md を読み、次に SPEC_FEATURES.md の「既知の問題（TODO）」セクションと機能一覧の実装状態を確認し、現在の進捗を把握せよ。
動作確認は GitHub Pages（https://tatugmad.github.io/FlexRoute/）で行う。

---

このプロンプトは引き継ぎ準備なしに新規チャットを開始した場合でも、
AIが CLAUDE.md → SPEC_FEATURES.md の順に読むことで、プロジェクトの全容と現在地を把握できるよう設計されている。

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
- **型定義一元管理**: 複数ファイルから参照される共有型は `src/types/` に集約する。コンポーネントの Props 型やコンポーネント内部でのみ使う局所型エイリアスは同一ファイル内での定義を許容する
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

### 設計判断の参照（コード内 D-xxx コメント）
- 過去の設計判断（処理方式の変更、API の切替等）に基づく実装には、コード内に `// D-xxx` のコメントを1行付けること
- 詳細は docs/DECISIONS.md を参照する。新しい設計判断が発生した場合は DECISIONS.md に追記し、次の番号を採番する
- これにより、将来同じ方式を再検討する際に「なぜ以前その方式を却下したか」を追跡できる

## テスト方針

### ツール
- **Vitest**: ユニットテスト・インテグレーションテスト
- **React Testing Library**: コンポーネントテスト
- **Playwright**: E2Eテスト（Phase2）

### テストコマンド
```bash
npm run test          # テスト実行
npm run test:watch    # ウォッチモード（ファイル変更で自動再実行）
```

### テストファイル配置
- テストファイルは対象ファイルと同じディレクトリに配置
- 命名規則: `対象ファイル名.test.ts` または `対象ファイル名.test.tsx`
- 例: `src/utils/generateId.ts` → `src/utils/generateId.test.ts`

### テストを書くタイミング
- 探索セッション: 書かない
- 整理セッション: コードが安定した機能からテストを追加
- 認証・課金（Phase2）: TDD（テストを先に書いてから実装）

### リグレッション防止
- GitHub Actions でPR作成時に全テスト自動実行
- テスト失敗時はマージをブロック
- テストが増えるほど安全網が強化される

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

## 命名規約（必ず従うこと）

コード内の命名は以下に従う。MD に記載された名前と異なる名前を使ってはならない。

| 正しい名前 | 使ってはいけない名前 | 対象 |
|---|---|---|
| `SavedPlace.memo` | `userNote` | SavedPlace 型のメモフィールド |
| `SavedPlace.originalName` | — | 型は `string \| null` |
| `placeStore.savePlace` | `addPlace` | 場所保存アクション |
| `placeStore.updatePlace` | — | 更新可能フィールド: `name`, `memo`, `labelIds`, `photoUrl`, `originalName` |
| `placeStorageService` | `placeStorage` | サービスの変数名 |
| `labelStorageService` | `labelStorage` | サービスの変数名 |
| `localStorageService` | `storageService` | ルート用サービスの変数名 |

新しい型・関数・コンポーネントを追加する際は、既存の命名パターンに揃えること。
判断に迷ったらユーザーに確認すること。

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
正しい解決: ナビゲーション画面では常時表示。ZIndex最上位 + デザイン差別化。ルート編集画面では表示しない（D-020）

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
| F-LOG v2（FlightRecorder） | 1-6（実装済み） |
| F-BUGREPORT（Bug ボタン） | 1-6（実装済み） |
| F-SIM（SensorBridge） | 1-6（実装済み） |
| F-ZOOM（ズーム制御） | 1-6（実装済み） |
| ステップ通過判定 + 案内文表示（useStepProgression, StepPassage） | 1-6 Step 1 |
| オートズーム D-023（useAutoZoom, ターン接近ズーム） | 1-6 Step 2 |
| 逸脱検知 + リルートダイアログ（useOffRouteDetection, RerouteDialog） | 1-6 Step 3 |
| ワイプマップ F-NAV-WIPE（WipeMap, 動的配置） | 1-6 Step 4 |
| ナビ中GPS記録（gpsLogStore, gpsLogStorageService） | 1-6 Step 5 |
| F-WAKELOCK + 25WP制限 + ドキュメント最終更新 | 1-6 Step 6 |
| 非ナビ中GPS自動記録（tracking） | 1-6後追加 |
| 走行記録画面（一覧・複数選択・Polyline表示） | 1-6後追加 |
| ルート編集の表示レイヤー切替パネル | 1-6後追加 |
| KMLエクスポート | 1-6後追加 |
| クモの巣走破地図（deck.gl） | フェーズ2 |
| 都道府県走破率・統計 | フェーズ2 |
| 個人APIキー設定（F-APIKEY） | フェーズ2 |
| APIコスト監視・無料枠超過停止（ローカルカウンタ + Cloud Monitoring同期） | フェーズ2 |
