# strategy/ — 戦略ドキュメント

FlexRoute のビジネス戦略・コスト戦略に関するドキュメントを格納する。

## ドキュメント一覧

| ファイル | 内容 |
|---|---|
| INDIVIDUAL_APIKEY_POSTMORTEM.md | 個人APIキー戦略v1のポストモーテム（OAuth自動化断念の記録） |
| PERSONAL_APIKEY_STRATEGY.md | 個人APIキー戦略v2（段階的移行モデル・規約再精査結果） |
| NAV_SDK_BUSINESS_MODEL.md | Navigation SDK ビジネスモデル分析（規約適合・コスト・ストアポリシー） |

## 未解決の最重要課題

**Google Maps API のコスト突破に向けた方針が定まりつつある。**

- FlexRoute の1キーで全ユーザーを賄うと、100ユーザーで月15万円、1,000ユーザーで月171万円
- 個人APIキー戦略v1（OAuth自動セットアップ）は技術的に断念
- **個人APIキー戦略v2（段階的移行モデル）を採用方針とする**（PERSONAL_APIKEY_STRATEGY.md）
  - 規約上は問題ないことを確認済み
  - 初回はFlexRouteキーで動作、段階的に個人キーへ移行
  - 個人キーならユーザーの無料枠でAPIコストゼロ
- Mapbox への移行も有力な選択肢（ゼンリンデータ統合済み、Yahoo!カーナビの実績、Google の約55%のコスト）
- 検討は別チャットで継続する
- **Navigation SDK ビジネスモデル**: 個人 API キー戦略 v2 を Navigation SDK に拡張適用可能と判断。スマホアプリのフリーミアム配信モデルは規約上成立する。詳細は NAV_SDK_BUSINESS_MODEL.md
