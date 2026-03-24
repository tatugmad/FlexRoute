# strategy/ — 戦略ドキュメント
FlexRoute のビジネス戦略・コスト戦略に関するドキュメントを格納する。
## ドキュメント一覧
| ファイル | 内容 |
|---|---|
| API_COST_ANALYSIS.md | Google Maps Platform SKU別コスト試算（新料金制度準拠） |
| MONETIZATION.md | 収益化戦略（SaaS + 無料アプリモデル・アプリストア手数料回避・損益計算） |
| COMPETITIVE_ANALYSIS.md | 競合分析・差別化アイデア |
| TECHNICAL_ALTERNATIVES.md | コスト削減の技術的選択肢（Mapbox/Azure/Amazon比較） |
| TOS_AND_IP.md | 利用規約調査・知財戦略 |
| INDIVIDUAL_APIKEY_POSTMORTEM.md | 個人APIキー戦略v1のポストモーテム（OAuth自動化断念の記録） |
| PERSONAL_APIKEY_STRATEGY.md | 個人APIキー戦略v2（段階的移行モデル・規約再精査・前例調査・停止リスク評価・無料枠超過防止） |
## 戦略の全体像
1. **APIコスト**: 個人APIキー戦略v2で解決。各ユーザーの無料枠内で利用、FlexRoute のAPIコスト = ¥0
2. **アプリストア手数料**: SaaS クライアントモデルで回避。課金は Web（Stripe）のみ、アプリは無料クライアント
3. **収益**: Stripe 手数料（約3.6%）のみ。1,000ユーザーで月33〜38万円の粗利（サーバー費用前）
