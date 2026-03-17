# 個人APIキー戦略 v1 — ポストモーテム

> 最終更新: 2026-03-17

## 概要

「各ユーザーに自分のGoogle Maps APIキーを発行してもらい、FlexRouteがそのキーを使う」戦略の検討記録。

## 断念理由

### 理由1: 規約違反の懸念（当時の判断）

Google Maps Platform Terms of Service, Section 3.2.1(c)(ii):
> "Customer will not access or use the Services in a manner intended to avoid incurring Fees"

当時の解釈: ユーザーごとにAPIキーを分けることで、FlexRouteが本来負担すべきAPI利用料を回避する意図があると判断。

### 理由2: 技術的制約

OAuth を使ったセットアップ自動化を検討したが、以下が API では不可能:

- 請求先アカウント（Billing Account）の新規作成
- クレジットカードの登録
- 請求先アカウントとプロジェクトの紐付け（既存アカウントがある場合のみ API で可能）

請求先アカウント + カード登録がないと、APIは実質使用不可（1日1リクエスト制限）。
「シームレスな自動セットアップ」は実現できない。

## 検討したOAuth自動化フロー

1. ユーザーが Google アカウントで OAuth ログイン
2. FlexRoute が OAuth トークンで以下を自動実行:
   - Cloud Resource Manager API でプロジェクト作成
   - Service Usage API で Maps API 有効化
   - API Keys API でキー作成・制限設定
3. 請求先アカウント作成・カード登録 → **API不可。ここで破綻**

## この文書の位置づけ

この文書は「OAuth自動セットアップ方式」の断念を記録する。

ただし、その後の規約再精査で以下が判明した:

- 「各ユーザーが自分でAPIキーを作成し、FlexRoute がそのキーを利用する」方式は**規約違反ではない**
- 断念理由1（規約違反）は誤った解釈に基づいていた
- 断念理由2（技術的制約）は変わらないが、手動セットアップ + 段階的移行モデルで解決可能

再精査後の方針は PERSONAL_APIKEY_STRATEGY.md（v2）に記録。
