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
