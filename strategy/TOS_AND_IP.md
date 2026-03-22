# 利用規約調査・知財戦略
> 最終更新: 2026-03-16
> ※ 法的助言ではなく一般的な知見に基づく記録
## Google Maps Platform 利用規約の重要条項
### 料金回避の禁止（最重要）
> "Customer will not access or use the Services in a manner intended to avoid incurring Fees"
> — Google Maps Platform Terms of Service, Section 3.2.1(c)(ii)
この条項により、無料枠の増大を意図したアカウント分割は規約違反と解釈されうる。
### その他の主要制限
| 制限 | 条項 | FlexRoute への影響 |
|---|---|---|
| 再販・サブライセンス禁止 | 3.2.1(b) | FlexRoute が API アクセスを再販する形態は不可 |
| コンテンツの外部利用禁止 | Maps Additional ToS | Google Maps の出力を別サービスで再利用不可 |
| 車載機器での使用禁止 | 3.2.3(f) | スマホアプリは対象外（車載ダッシュボード組み込みが禁止） |
| 検索結果の改変禁止 | 3.2.3(g) | ルートの色分け表示は改変には該当しない（付加情報の表示） |
| キャッシュ制限 | Maps Service Terms | Place 情報の緯度経度は30日間のみキャッシュ可 |
### Google マイマップ KML インポートの規約上の評価
ユーザー自身が Google マイマップで KML をエクスポートし、FlexRoute にインポートする行為:
- プログラム的な自動取得ではなく、ユーザーの手動操作
- グレーゾーンだが、ユーザーが自分のデータを自分で持ち運ぶ行為と解釈可能
- リスクはゼロではない（Google は「サービスの出力を他のサービスで使うこと」を広く制限）
### FlexRoute が Android アプリとして有料配布することは許可されている
> "You can charge a fee for your Maps API Implementation if it is an Android application downloadable to mobile devices from the Google Play Store."
> — Google Maps APIs Terms of Service, Section 9.1.2
## 知財戦略
### 特許取得の可能性
走行記録を地図上に表示する機能には多数の先行技術が存在:
- Strava Global Heatmap
- Relive
- Garmin Connect
- RideWithGPS
- Yahoo!カーナビ
- Google Maps タイムライン
特許の新規性・進歩性の要件を満たすのは困難。
### 特許可能性がある領域
「国道番号ごとの走破率を管理・表示するシステム」は先行技術が見当たらない。
走破ゲーミフィケーション（国道コンプリート、都道府県制覇バッジ等）は検討の余地あり。
ただし要専門家（IT系弁理士）の先行技術調査。
### 推奨される知財保護手段
| 手段 | 有効性 | コスト | 推奨度 |
|---|---|---|---|
| 特許（機能・アルゴリズム） | △ 先行技術で拒絶リスク高 | 出願50〜100万円 | 低 |
| 意匠（UI画面デザイン） | ○ 具体的な画面は保護可能 | 出願10〜20万円 | 中 |
| 商標（FlexRoute、クモの巣走破地図） | ◎ 確実に取得可能 | 出願5〜10万円 | **高** |
| 著作権（コード・デザイン） | ◎ 登録不要で自動発生 | ¥0 | 既に保護済み |
| 先行公開による防衛 | ○ 他者の特許取得を阻止 | ¥0 | **高** |
**最も費用対効果が高いのは商標登録 + 先行公開。**
GitHub リポジトリが Public であること自体が先行技術の証拠になる。