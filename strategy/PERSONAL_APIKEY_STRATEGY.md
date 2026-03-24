# 個人APIキー戦略 v2 — 段階的移行モデル

> 最終更新: 2026-03-17

## 経緯

INDIVIDUAL_APIKEY_POSTMORTEM.md に記録した「個人APIキー戦略v1」は以下の2点で断念した:

1. 規約違反の懸念
2. 請求先アカウント作成・カード登録のAPI自動化が不可能

その後の再精査で、1について判断を撤回した。

## 規約の再精査結果

### "avoid incurring Fees" 条項の再解釈

Google Maps Platform Terms of Service, Section 3.2.1(c)(ii):

> "Customer will not access or use the Services in a manner intended to avoid incurring Fees"

"Customer" = Google Cloud の利用規約に同意した者。

- シナリオA（FlexRoute が複数アカウントを作成して自社トラフィックを分割する）→ FlexRoute が Customer。本来負担すべき Fees の回避意図が明確。**規約違反。**
- シナリオB（各ユーザーが自分で Google Cloud アカウントを作成し、自分のAPIキーで FlexRoute を使う）→ 各ユーザーが Customer。ユーザーは自分のプロジェクトで自分のために API を使っている。各ユーザーの利用は無料枠内。**回避すべき Fees がそもそも存在しない。規約違反ではない。**

### 補強する条項

- Section 2.1: "Free Quota. Certain Services are provided to Customer without charge up to the Fee Threshold" — Google 自身が Customer ごとの無料枠を定めている
- Section 1.2: 各ユーザーが自分のアカウント・APIキーの管理責任を持つ構造を規約は想定
- Section 3.1: "non-sublicensable" — FlexRoute は Google のライセンスを再許諾していない。ユーザーが自分で Google と直接契約（アカウント作成 = 規約同意）している

### 結論

個人のAPIキーを FlexRoute が利用する方式は**規約違反ではない**。

## 技術的制約（変更なし）

- 請求先アカウントの新規作成: Google Cloud Console でのみ可能（API不可）
- クレジットカードの登録: Google Cloud Console でのみ可能（API不可）
- 請求先アカウント + カード登録がないと、APIは1日1リクエストに制限される

つまり、ユーザーが自分で Google Cloud Console を操作する必要がある。

ただし Google Maps Platform 専用のクイックセットアップURLが存在する:

```
https://console.cloud.google.com/google/maps-apis/start
```

これを使えば、プロジェクト作成→請求先設定→API有効化→キー発行がウィザード形式で一気に進む。
通常の8ステップが約3画面に短縮される。

## 無料枠の事実確認

- 無料枠は請求先アカウント（Billing Account）単位で適用
- SKU ごとに固定回数（Essentials: 10,000、Pro: 5,000、Enterprise: 1,000）
- **毎月1日の太平洋時間午前0時にリセット**（繰り越しなし）
- 1ユーザーの FlexRoute 利用は全SKUで無料枠の6〜20%しか消費しない
- 個人が通常利用で無料枠を使い切ることは現実的にありえない

## 採用する戦略: 段階的移行モデル

### 基本方針

初回から個人キーを要求しない。FlexRoute のキーで即座に使い始められる状態をデフォルトとし、段階的に個人キーへの移行を案内する。

### フェーズ

| フェーズ | 動作 | ユーザー操作 |
|---|---|---|
| 初回〜 | FlexRoute のキーで動作 | **何もしない** |
| FlexRoute の無料枠上限が近づいたら | アプリ内で個人キー設定の案内を表示 | 個人キーの設定（任意） |
| サブスク開始後 | 課金ユーザーは FlexRoute キー継続 | サブスク支払い |

初期のユーザーが少ない段階では FlexRoute のキーの無料枠で全員分が賄える。
ユーザーが増えてコストが問題になる頃には、サブスク収入があるか、技術者ユーザーが自分のキーに移行している。

### 個人キー設定のUX

#### 設定画面

```
┌──────────────────────────────────┐
│  🔑 自分の API キーを使う        │
│                                  │
│  Google の無料枠で完全無料に     │
│  なります（月額¥0）              │
│                                  │
│  [ Google Cloud を開く ]         │
│    → クイックセットアップURLに遷移│
│                                  │
│  完了したらキーを貼り付け:       │
│  ┌──────────────────────┐       │
│  │                      │       │
│  └──────────────────────┘       │
│  [ キーを検証して保存 ]          │
└──────────────────────────────────┘
```

- 「Google Cloud を開く」ボタンが `https://console.cloud.google.com/google/maps-apis/start` に遷移
- 戻ってきたらキーを貼り付け
- 「キーを検証して保存」で即座に動作チェック（Maps JavaScript API を1回呼んで成功するか確認）

#### QRコード並行作業（PCユーザー向け）

PCでルート作成中のユーザーに、スマホで Google Cloud セットアップを完了させる導線:

- FlexRoute (PC) → QRコード表示 → スマホで読み取り → クイックセットアップ完了 → キーをコピー → PCの FlexRoute に貼り付け
- 既に FlexRoute のヘッダーにQRコード機能があるため、この導線と親和性が高い

#### 支援コンテンツ

- スクリーンショット付きステップバイステップガイド（アプリ内）
- 動画チュートリアル（2分程度）
- 有効化すべきAPIのチェックリスト
- キー制限設定値のコピペ用テキスト
- 「カード登録は確認用で、無料枠内なら請求は発生しません」の明確な説明

## 無料枠超過防止: ローカルカウンタ + Cloud Monitoring 同期方式

### 設計方針

ローカルカウンタ（即時・無料）を主軸に、Cloud Monitoring API の実使用量で定期的に補正する。
FlexRoute が全て管理し、ユーザーは Google Cloud Console でクォータや予算を一切触る必要がない。
ユーザーに課金が発生する可能性をゼロにする。

### 基本ロジック

```
ユーザーの操作
  → FlexRoute ローカルカウンタをチェック
    → 上限未満 → API 呼び出し → カウンタ +1
    → 上限到達 → 「今月の無料枠に達しました」表示 → API 呼び出ししない
  → 100回ごと（または1日1回）
    → Cloud Monitoring API で実使用量を1回取得
    → ローカルカウンタを実使用量で上書き（リセット）
```

### このロジックが解決する問題

| 問題 | 解決方法 |
|---|---|
| ローカルデータの破損・消失 | 次の同期で実使用量に復帰 |
| カウンタの誤差蓄積 | 同期で補正 |
| 複数デバイスからの利用 | 実使用量は全デバイス合算値なので自然に合算 |
| 料金体系の変更 | 実使用量ベースなので無料枠の定義が変わっても追従可能 |
| Cloud Monitoring API 自体のコスト | 1日数回程度の呼び出しで実質無料 |

### カウンタ補正の挙動

#### ローカルカウンタ < 実使用量（別デバイス利用、カウンタ破損）

```
ローカルカウンタ: 200
実使用量:        350
  → カウンタを 350 に上書き
  → 即座に正しい残量が表示される
```

#### ローカルカウンタ > 実使用量（カウント重複等）

```
ローカルカウンタ: 500
実使用量:        380
  → カウンタを 380 に上書き
  → ユーザーの利用可能枠が回復（不当な制限を解除）
```

どちらに転んでもユーザーに不利益がない。実使用量が常に正（truth）。

### SKU別の月間上限設定値

無料枠の80%を上限とし、20%のバッファーで超過を防止。

| SKU | 無料枠 | 上限（80%） | 超過時の動作 |
|---|---|---|---|
| Routes Pro | 5,000 | 4,000 | ルート計算ボタンを無効化、メッセージ表示 |
| Autocomplete | 10,000 | 8,000 | 検索入力を無効化 |
| Details Essentials | 10,000 | 8,000 | Place情報を「次月まで制限中」と表示 |
| Details Photos | 1,000 | 800 | 写真をプレースホルダーに差し替え |
| Static Maps | 10,000 | 8,000 | サムネイルをキャッシュのみで表示 |
| Nearby Search | 5,000 | 4,000 | クイック検索を無効化 |
| Dynamic Maps | 10,000 | 8,000 | ここに達することは現実的にない |

### 段階的制限のUX

| 段階 | 閾値 | 動作 |
|---|---|---|
| 通常 | 0〜70% | 制限なし |
| 警告 | 70〜80% | バナー「今月の無料枠の70%を使用しました」 |
| 制限 | 80%〜 | 高コストAPI（Routes, Nearby Search, Photos）を停止。地図表示と閲覧は継続 |

### 同期に必要な OAuth スコープ

| スコープ | 用途 |
|---|---|
| `monitoring.read` | Cloud Monitoring で実使用量を読み取り |

Phase 1（ブラウザ、localStorage）ではローカルカウンタのみ。
Phase 2（ネイティブアプリ + サーバー）で Cloud Monitoring 同期を追加。

### カウンタの保存場所

| フェーズ | 保存先 | リセット |
|---|---|---|
| Phase 1 | localStorage | 毎月1日 太平洋時間0:00（Google と同期） |
| Phase 2 | サーバーDB | 同上 + Cloud Monitoring で定期補正 |

### Google Cloud 側の補助機能（参考）

FlexRoute のカウンタが主軸だが、Google Cloud 側にも安全機能がある:

| 機能 | 用途 | 自動停止 |
|---|---|---|
| クォータ制限（Service Usage API） | 日あたりのリクエスト上限 | する（403エラー） |
| 予算アラート（Budget API） | 月額が閾値に達したらメール通知 | しない（通知のみ） |
| Cloud Monitoring メトリクス | SKU ごとの実使用量をリアルタイム取得 | しない（データのみ） |

FlexRoute のカウンタ + Cloud Monitoring 同期で十分だが、
万一の最終安全弁として Google Cloud 側のクォータ制限も併用可能（Phase 2 で Service Usage API から設定）。

## Google Cloud APIキー発行の全手順（参考）

> **注意: Map ID はユーザーの設定不要。** Map ID は FlexRoute が管理するベクターマップ設定であり、
> アプリに組み込まれている。ユーザーが発行・設定する必要があるのは API キーのみ。

Google アカウントのみの状態からの手順:

1. Google Cloud Console にアクセス（https://console.cloud.google.com/）→ ログイン → 利用規約同意
2. プロジェクト作成（名前入力 → 作成、約1分）
3. **請求先アカウント作成（最大の壁）**: 左メニュー「課金」→ アカウント作成 → 国選択 → カード登録 → 無料トライアル開始（3〜5分）
4. Maps API 有効化: 「APIとサービス」→「ライブラリ」→ Maps JavaScript API / Routes API / Places API (New) / Maps Static API を各々有効化（2分）
5. APIキー作成: 「APIとサービス」→「認証情報」→「認証情報を作成」→「APIキー」（30秒）
6. キー制限（推奨）: キーを編集 → HTTPリファラー制限 + API制限を設定（2分）
7. FlexRoute にキーを貼り付け（30秒）

合計約10分。クイックセットアップURL使用で短縮可能。

## 前例調査
「ユーザー本人の Google Maps API キーをアプリに設定して使う」パターンの前例。
### Google 公式認定: WordPress エコシステム
Google 自身が https://developers.google.com/maps/third-party-platforms/wordpress で「自分のAPIキーを発行してプラグインに設定する」手順を公式に案内。対象プラグイン: WP Go Maps, GeoDirectory, Otter Blocks, API KEY for Google Maps 等多数。
GeoDirectory は Maps JS API + Geocoding + Places API を含む11個のAPIを使用しており、単純な地図埋め込みを超えた前例。
### SetCompass（Webアプリ）
ハイキング・ウォーキング向けルート計画 Web アプリ。ユーザー登録時に自分の Google Maps API キーの貼り付けを要求。サブスクリプション料金は Google Maps の課金とは別であると明記。使用API: Maps JS API + Places API。
FlexRoute との最大の類似点: 「ユーザーがキーを貼り付けて Web アプリを使う」構造が完全に同一。
### Traccar（セルフホスト型 GPS トラッキング）
オープンソースの GPS トラッキングプラットフォーム。サーバー設定の属性として Google Maps API キーを入力。ユーザーグループごとの個別キー設定も議論されている。使用API: Maps Tiles API + Geocoding API。
### Checkmate（レストラン注文アプリ）
レストラン向け Web・モバイル注文システム。事業者が自分の Google Maps API キーを設定し、Maps JS API + Places API + Routes API を含む複数のAPIを使用。使用 API の範囲が FlexRoute に近い。
### OpenRouter BYOK（AI分野の構造的前例）
「Bring Your Own Key」モデルを公式に提供。ユーザーが自分の API キーとクレジットを活用して LLM サービスを利用。上流プロバイダコストの5%を手数料とする。Google Maps ではないが、「アプリ提供者のインフラで、ユーザーの API キーを使ってサービスを提供する」ビジネスモデルの構造は同一。
### FlexRoute と前例の差異
| 比較軸 | WordPress | SetCompass | Traccar | Checkmate | FlexRoute |
|---|---|---|---|---|---|
| 形態 | プラグイン | Web アプリ | セルフホスト | B2B SaaS | Web → ネイティブ |
| キー設定主体 | サイト管理者 | エンドユーザー | サーバー管理者 | 事業者 | エンドユーザー |
| Maps JS API | ✅ | ✅ | ✅ | ✅ | ✅ |
| Places API | 一部 | ✅ | ✗ | ✅ | ✅ |
| Routes API | ✗ | ✗ | ✗ | ✅ | ✅ |
| Roads API | ✗ | ✗ | ✗ | ✗ | ✅（Phase 2） |
| ナビゲーション | ✗ | ✗ | ✗ | ✗ | ✅ |
| Google 公式認定 | ✅ | ✗ | ✗ | ✗ | ✗ |
Routes/Roads API を個人キーで使う前例は確認できなかった。ただし規約は API の種類ごとに異なる制限を設けておらず、全 SKU に同一の ToS が適用されるため、Maps JS API で許されるパターンが Routes API で禁止される根拠はない。
## 停止リスク評価
### Google Maps Platform ToS の停止規定
| 状況 | Google の義務 |
|---|---|
| AUP 違反の疑い（Section 5.1） | 先に通知 → 24時間の猶予 → 未是正なら停止 |
| インフラ保護・法令・不正アクセス（Section 5.2） | 即時停止可能（事後に理由通知の義務あり） |
| ライセンス制限 Section 3.2 違反（Section 5.2d） | 即時停止可能 |
### FlexRoute の場合
個人キー方式では各ユーザーが自分の Customer として無料枠を正当に使用。Section 3.2 違反がないため即時停止の要件に該当しない。仮に Google が問題視しても、まず通知 → 24時間の猶予がある手続きになる。
さらに重要: 停止されるのは個々のユーザーの Google Cloud アカウントであり、FlexRoute のサービス自体ではない。
### 現実的なリスクの順序
1. Google が問題視する → まずない（無料枠の20%未満の利用、異常パターンなし）
2. 仮に問題視しても → 通知が先、24時間の猶予
3. 影響範囲 → 個々のユーザーのアカウント。FlexRoute 全体が止まるわけではない
### Google への事前問い合わせについて
得策ではないと判断。Google のサポートは収益を守る立場にあり、グレーゾーンの質問には保守的に回答する動機がある。規約の文言上問題がなく、Google 公式が同パターンを WordPress で推奨している現状を維持する方が合理的。数万ユーザー規模で Google から直接連絡が来る段階では、個人キーの是非ではなくボリュームディスカウントや Enterprise 契約の交渉になる。

## v1（POSTMORTEM）との差異

| 論点 | v1（断念） | v2（採用） |
|---|---|---|
| 規約違反か | 違反と判断 | **違反ではない（再精査）** |
| OAuth自動セットアップ | 検討して断念 | 不要（手動でよい） |
| ユーザー体験 | シームレスを追求して破綻 | **段階的移行で初回ハードルゼロ** |
| カード登録の壁 | 致命的と判断 | 残るが、価値体験後なので離脱率低下 |
| 実装タイミング | Phase 2 | Phase 2（設定画面 + ガイド） |
