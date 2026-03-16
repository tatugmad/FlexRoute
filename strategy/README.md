# FlexRoute サービス企画戦略
> 最終更新: 2026-03-16
## 概要
FlexRoute のビジネス戦略・APIコスト分析・収益化・競合分析・規約調査の記録。
開発ドキュメント（CLAUDE.md, docs/）とは独立し、サービス企画の検討経緯と結論を保持する。
## ドキュメント一覧
| ファイル | 内容 |
|---|---|
| API_COST_ANALYSIS.md | Google Maps Platform の SKU 別コスト試算（新制度準拠） |
| MONETIZATION.md | 収益化戦略・フリーミアムモデル・損益分岐 |
| COMPETITIVE_ANALYSIS.md | 競合サービス分析・差別化アイデア |
| TECHNICAL_ALTERNATIVES.md | APIコスト削減の技術的選択肢・代替ルーティングエンジン |
| TOS_AND_IP.md | Google Maps Platform 利用規約の調査結果・知財戦略 |
| INDIVIDUAL_APIKEY_POSTMORTEM.md | 個人APIキー戦略の検討経緯と断念理由（重要な失敗記録） |
## 未解決の最重要課題
**Google Maps API のコストをどう突破するか。**
- FlexRoute の1キーで全ユーザーを賄うと、100ユーザーで月15万円、1,000ユーザーで月171万円
- 個人APIキー戦略は規約違反 + 技術的に不可能で断念
- この課題を解決するアイデアが見つかれば、画期的なアプリになる
- 検討は別チャットで継続する