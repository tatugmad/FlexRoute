# FlexRoute

Google Maps API を使ったルート制作 & ナビ Web アプリ

## セットアップ

```bash
npm install
cp .env.example .env
# .env に Google Maps API Key と Map ID を設定
npm run dev
```

## 必要な環境変数

| 変数名 | 説明 |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API キー |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps Map ID |

## 開発コマンド

```bash
npm run dev       # 開発サーバー起動
npm run build     # プロダクションビルド
npm run preview   # ビルド結果プレビュー
npm run lint      # ESLint 実行
```

## 技術スタック

- React 19 + TypeScript
- Vite
- Zustand (状態管理)
- Tailwind CSS v4
- Google Maps JavaScript API / Routes API v2
