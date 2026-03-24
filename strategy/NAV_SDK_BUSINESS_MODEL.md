# Navigation SDK ビジネスモデル分析

> 最終更新: 2026-03-24
> ※ 法的助言ではなく一般的な知見に基づく記録

## 検討対象のビジネスモデル

FlexRoute の商品化モデルとして以下を検討:

1. FlexRoute は Web ブラウザアプリとして提供。ユーザーの Google Cloud アカウントの API キーを利用して機能を提供する（PERSONAL_APIKEY_STRATEGY.md の段階的移行モデル）
2. PC やスマホのブラウザで、ルート編集やナビゲーションができる
3. FlexRoute はアカウント登録制。月額料金を独自に集金する（フリーミアム: 一部機能は無料、本格利用は有料）
4. 同機能にアクセスするための UI の一つとして、Google Navigation SDK を利用したスマホアプリを App Store / Google Play で「無料アプリ」として配信する。高度な機能の利用には FlexRoute の有料アカウントが必要
5. API キーは全てユーザー本人の Google Cloud アカウントのものを使用する

## 論点別分析

### 1. Navigation SDK の「商用アプリ専用」制約

**結論: FlexRoute は該当する。問題なし。**

Google のポリシー: "The Navigation SDK for Android is allowed only for commercial applications."

- FlexRoute は月額課金モデル（Rider ¥980 / Pro ¥1,980）を持つ商用サービス
- フリーミアムの無料プランも商用アプリの一部として認められる
- Cowboy（e-bike アプリ）のように消費者向けモビリティアプリが Navigation SDK を使っている実例あり
- 物流・ライドシェアに限定されていない

### 2. App Store / Google Play での「無料アプリ」配信

**結論: フリーミアムモデルなら問題なし。ただし Apple IAP 規制に注意。**

- Apple も Google Play も「freemium」モデルを公式に推奨
- アプリ自体は無料、一部高度な機能にサブスクリプションが必要、という構造はストアポリシー上正当

**Apple IAP の注意点:**

- アプリ内で消費されるデジタル機能のアンロックには Apple の In-App Purchase（IAP）使用義務がある
- FlexRoute がアプリ外（Web サイト）でのみ課金してアプリ内機能をアンロックすると、Apple の 30% 手数料回避と判断されリジェクトリスク

**回避策:**

| 方法 | 説明 |
|---|---|
| IAP と外部課金の併用 | iOS アプリ内からは IAP 経由（Apple に 15-30%）、Web からは Stripe 直接決済 |
| 「リーダーアプリ」例外 | ルートを Web で作成しアプリで閲覧・ナビする構造は、コンテンツの外部作成・閲覧に該当する可能性 |
| 推奨策 | iOS: IAP、Web: Stripe、Android: Google Play Billing を使い、サーバー側でサブスク状態を統一管理 |

### 3. Navigation SDK をユーザーの API キーで使えるか

**結論: 可能。PERSONAL_APIKEY_STRATEGY.md の論理がそのまま適用できる。**

- 各ユーザーが自分の Google Cloud アカウントで API キーを発行
- 各ユーザーが Customer として Google と直接契約（アカウント作成 = 規約同意）
- FlexRoute は Google のライセンスを再許諾していない（non-sublicensable 条項に抵触しない）
- 各ユーザーの利用は無料枠内

**Navigation SDK の無料枠と利用量:**

| 項目 | 無料枠 | 想定利用量（バイクツーリング） | 消費率 |
|---|---|---|---|
| Navigation Request | 1,000 destinations/月 | 10-30/月 | 1-3% |
| Maps SDK (Android/iOS) | 無制限 | - | 0% |

バイクツーリングの利用頻度（週末数回、各回 1-2 destinations）では無料枠を使い切ることは現実的にありえない。

**技術的な実装:**

- Android: NavigationApi 初期化時にユーザーの API キーをプログラム的に指定可能
- iOS: GMSServices.provideAPIKey() を呼ぶ前にユーザーのキーを取得し動的設定可能
- 初回起動時に API キー入力画面を表示、保存、次回起動時にそのキーで初期化

### 4. Google Maps を「複製」するアプリの禁止条項

**結論: FlexRoute は該当しない。**

Google Maps Platform Terms Section 3.2.3(d)(iv) の禁止事項:
"combine data from the Directions API, Geolocation API, and Maps SDK for Android to create real-time navigation functionality substantially similar to the functionality provided by the Google Maps for Android mobile app"

- スマホアプリが Navigation SDK を使う場合、この条項は適用されない。Navigation SDK はまさにそのナビ機能を提供するための正規 SDK
- Web 版（Routes API + Maps JavaScript API での自前ナビ）も「保存済みルートのオフライン再生」であり、リアルタイムで Routes API を呼ぶ Google Maps とは構造が根本的に異なる

### 5. コスト構造

**個人キー利用時の FlexRoute 側 API コスト: ¥0**

全ての API 呼び出しがユーザーの Google Cloud アカウントで行われるため、FlexRoute 側の API コスト負担はゼロ。MONETIZATION.md の損益計算が劇的に改善する。

FlexRoute が負担するのはサーバー費用（月3-5万円: DB, 認証, サブスク管理）のみ。

### 6. Web 版とネイティブ版の API 体系の違い

| プラットフォーム | 地図 | ナビゲーション | 課金主体 |
|---|---|---|---|
| Web（ブラウザ） | Maps JavaScript API | Routes API v2 + 自前ステップ再生 | ユーザーの API キー |
| Android | Navigation SDK（Maps SDK 含む） | Navigation SDK | ユーザーの API キー |
| iOS | Navigation SDK（Maps SDK 含む） | Navigation SDK | ユーザーの API キー |

2つの異なる API 体系を使うが、それぞれ Google の想定する正当な利用形態であり、ライセンス上の問題はない。

## Navigation SDK で得られる追加機能

Web 版（Routes API）では得られないが、Navigation SDK では利用可能な機能:

| 機能 | Web 版 | Navigation SDK |
|---|---|---|
| レーンガイダンス | 不可 | 可能（Lane クラス） |
| リアルタイム交通情報 | 不可 | 可能 |
| 動的リルート | Routes API 再呼出し | SDK 内部で自動 |
| 音声案内 | 不可（TTS で代替は可能） | 内蔵 |
| 速度制限表示 | 不可 | 可能 |
| 信号・一時停止アイコン | 不可 | 可能 |

## リスク評価

| リスク | 深刻度 | 対策 |
|---|---|---|
| Apple IAP 手数料（15-30%） | 中 | IAP と外部課金の併用。業界標準の課題であり FlexRoute 固有ではない |
| Google が個人キー戦略を問題視 | 低 | PERSONAL_APIKEY_STRATEGY.md で規約精査済み。各ユーザーが Customer として直接契約する構造 |
| Navigation SDK の「商用アプリ専用」でリジェクト | 低 | FlexRoute は課金モデルを持つ商用サービス |
| Navigation SDK の価格改定 | 低 | ユーザーの無料枠内で運用するため、無料枠が廃止されない限り影響なし |

## 総合判断

**このビジネスモデルは成立する。**

最大のリスクは Apple IAP の手数料構造のみで、これは業界標準の課題であり FlexRoute 固有の問題ではない。strategy/ の既存分析（個人 API キー戦略 v2、規約精査結果）は Navigation SDK にも論理的に拡張可能であり、追加の規約違反リスクは見当たらない。

## 次のステップ

- Phase 2 のネイティブ移行計画で Navigation SDK の技術調査を実施
- Apple IAP / Google Play Billing の実装方針を決定
- Google Maps Platform の営業窓口に FlexRoute のユースケースを確認（任意だが推奨）
