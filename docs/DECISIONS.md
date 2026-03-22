# FlexRoute 設計判断記録

> 最終更新: 2026-03-22

各判断について「決定」「理由」「却下した選択肢」「却下理由」を記載する。
これにより、将来の開発者やAIが「なぜこうなっているのか」を理解でき、
同じ議論を繰り返すことを防ぐ。

## D-001: スクラッチ再構築の決定

- **決定**: 旧コード（SmartNavi）を改修せず、ゼロからスクラッチで再構築する
- **理由**: App.tsx 943行のモノリスに全state（30個以上のuseState）が集中。再レンダリング地獄でパフォーマンスが劣悪。AIによる改修もハルシネーションが多発し進まなかった
- **却下**: 旧コードのリファクタリング → 影響範囲が予測不能で改修コストがスクラッチより高い

## D-002: Zustand の採用

- **決定**: 状態管理に Zustand を採用し、6つのストア（route, navigation, place, ui, label, sensor）に分割
- **理由**: Reduxより軽量でストア分割が容易。各ストアが独立しているため不要な再レンダリングが発生しない
- **却下**: Redux → ボイラープレート過剰。Context API → 再レンダリング最適化が困難

## D-003: 1ファイル150行以内ルール

- **決定**: 全コンポーネント・ストア・サービスを150行以内に制限
- **理由**: AIがコードを正確に修正するため。旧コードの943行ファイルではAIがハルシネーションを起こした。150行なら1つのコンテキストウィンドウで全体を把握できる

## D-004: StorageService の抽象化

- **決定**: データ永続化をStorageServiceインターフェースで抽象化
- **理由**: フェーズ2でPostgreSQLに移行する際、実装を差し替えるだけで済む。コンポーネントやストアは変更不要

## D-005: ウェイポイントのJSONB集約

- **決定**: ウェイポイントを別テーブルに正規化せず、ルートのJSONBカラムに集約する
- **理由**: スナップショット単位のバージョン管理のため。ウェイポイントを個別にバージョン管理すると、「1世代前のウェイポイント組み合わせ」が特定不能になる。例えば、ポイントAのv1/v2とポイントBのv1/v2がある場合、1世代前がどの組み合わせか判定できない
- **却下**: waypointsテーブルに正規化 → バージョン紐付け問題が発生

## D-006: Place/座標の完全分離

- **決定**: 地図タップ時、Placeアイコンタップと地図面タップを明確に分離する
- **理由**: Google Maps APIの click イベント仕様として、Placeアイコンタップ時は e.detail.placeId が返され、地図面タップ時は返されない。この仕様上の区別をそのまま使う。地図面タップでreverseGeocodeを呼ぶと意図せず近くの施設名がウェイポイント名に入り混乱する
- **ルール**: 地図面タップではreverseGeocode/Places APIを絶対に呼ばない。座標表示のみ

## D-007: 自動保存のタイミング設計

- **決定**: WP操作は即座保存、テキスト入力はblur時保存。debounceとbeforeunloadは不使用
- **理由**: WP操作は1回の操作で1回しか発生しないため即座保存で負荷なし。テキスト入力はキーストロークごとの保存を防ぐ必要があるが、debounceより blur（フォーカスアウト）の方が「入力確定」の意図が明確。F5でテキスト入力中の数文字が失われるのは許容範囲
- **却下**: debounce 2秒 → 操作完了の判定が曖昧。beforeunload → blur+即座保存でカバー済み

## D-008: 履歴方式の採用方向（ドラフト方式の却下）

- **決定**: ルート編集の安全性確保に、ドラフト方式ではなく履歴（スナップショット）方式を採用する方向で検討中
- **理由**: ドラフト方式は「下書き」の概念が必要でユーザーの学習コストが高い。履歴方式はUndo/Redoと同じ操作感で直感的。DB設計方針（BEFORE UPDATEトリガー）と完全一致。↶↷ボタンで「閲覧モード」に入り、「この時点から再開」で確定する設計を検討中
- **却下**: ドラフト方式 → 概念が複雑。条件付きスキップ方式 → 条件境界で不安定
- **ステータス**: 未実装・要検討。暫定は条件付き上書き保存

## D-009: GPS記録の3m閾値

- **決定**: 前回記録点から3m未満のGPS座標を除外する
- **理由**: GPSジッター（停車中や低速時のふらつき）ノイズを除去するため。3mはヘアピンカーブ（曲率半径10〜15m）も十分トレースできる粒度
- **却下**: 10m → ヘアピンが潰れる。曲率適応記録（リアルタイム曲率計算で記録頻度を変える）→ GPS精度5〜15mの中で3点からの曲率計算が不安定。全座標記録+後処理間引きの方が正確

## D-010: クモの巣走破地図に deck.gl を採用

- **決定**: 数十年分のGPSログ描画に deck.gl PathLayer + WebGL を使用
- **理由**: 300万点以上を60fpsで描画する要件。Google Maps Polylineは数万点で限界。deck.gl はUberが数百万台のタクシー軌跡用に開発したライブラリで同等の要件を実績で証明済み。Google EarthがGPU描画（OpenGL）で軽快だったのと同じ仕組み（WebGL）をブラウザで実現
- **却下**: Canvas 2D → 300万点は限界域。通常Polyline → 不可能

## D-011: 非ナビ中GPS記録を常時ON

- **決定**: 非ナビ中のGPS記録のON/OFF選択肢をUIに設けず、常に記録する
- **理由**: UIの複雑化を防止。クモの巣走破地図のデータ蓄積には非ナビ中の移動記録も重要。「全国の道路を塗りつぶす」目標に対し、記録漏れを防ぐ

## D-012: 2段階測位方式 → D-017 で2系統並走に発展

- **決定**: 現在地の初期表示にWiFi/IP測位（低精度・即時）→ GPS測位（高精度・バックグラウンド）の2段階方式
- **理由**: getCurrentPosition(enableHighAccuracy: true) は1〜5秒かかる。ローディング画面（グルグル）はUX劣悪。東京デフォルト→現在地移動はちらつきが発生。WiFi測位で即座に表示し、GPS取得後にpanToで微調整する方式が最善。2回目以降はnavigationStoreのキャッシュで即座表示
- **却下**: ローディング表示 → 数秒待たされる。東京デフォルト→移動 → ちらつき発生
- **発展**: D-017 により、初期表示だけでなく継続監視も2系統並走に拡張。GPSロスト時の保険として副系（Wifi/IP）が常時動作する
- **ステータス**: D-020 により方針変更。ルート編集画面では Geolocation API を使用せず、lastKnownPosition（localStorage）で初期センタリングを行う

## D-013: ルートの保存条件

- **決定**: ウェイポイント1件以上 OR ルート名がtrim()で空でない場合のみ保存
- **理由**: 空ルート（名前もWPもなし）が一覧にゴミとして残ることを防ぐ。一方で名前だけのルート（WPなし）は「後でウェイポイントを追加する予定」のケースがあるため保存する。条件を満たさなくなった場合はStorageを上書きしない（既存ルートの全削除でデータが失われないようにする）

## D-014: 保存ルートによるオフラインナビゲーション

- **決定**: ルート計算結果のlegs/stepsを全て保存し、ナビ時にRoutes APIを再呼出しない
- **理由**: ユーザーが「決定したルート」でナビしたい。Routes APIを再呼出すると交通状況等でルートが変わるリスクがある。これはFlexRouteの重要なセールスポイント

## D-015: 走行記録の表示に通常Polyline使用（deck.glは走破地図のみ）

- **決定**: 走行記録画面やルート編集の実走表示には通常の Google Maps Polyline を使用。deck.gl はクモの巣走破地図のみ
- **理由**: 走行記録画面で同時に表示するのは十数本程度。この規模なら通常Polylineで軽快に動く。deck.gl を導入すると依存関係とコードの複雑さが増す。必要な場面（300万点以上の走破地図）のみ deck.gl を使う

## D-016: リポジトリをPublicに変更

- **決定**: FlexRoute リポジトリを Private から Public に変更
- **理由**: GitHub Pages は無料プランでは Public リポジトリのみ利用可能。API Key は GitHub Secrets に保管しているためコードが公開されても漏洩しない
- **リスク**: ソースコードが公開される。ただし商用秘密に該当するロジックはなく、問題なし

## D-017: 2系統並走測位方式（GPSロスト対策）

- **決定**: useGeolocation で watchPosition を2本同時に走らせる。主系（enableHighAccuracy: true = GPS）と副系（enableHighAccuracy: false = Wifi/IP）
- **理由**: 1本の watchPosition（高精度のみ）ではGPSロスト時（トンネル等）に位置更新が途絶える。ブラウザの Geolocation API は GPS→Wifi/IP への自動フォールバックを保証しない。2本並走で主系沈黙時に副系が保険として機能する。副系が先に返ることで初回表示も高速化される
- **却下**: watchPosition 1本（高精度のみ）→ デスクトップやGPSロスト時に沈黙。accuracy ベースの推定 → 自分たちの設計では2系統を明示管理しているので不要
- **ステータス**: D-019 により廃止。2系統並走の設計前提が崩れたため、accuracy 値ベースの管理に移行

## D-018: デッドレコニング（加速度センサー位置推測）の見送り

- **決定**: GPSロスト時にスマホの加速度センサーで現在位置を推測する機能は Phase 1 では実装しない
- **理由**: ブラウザの DeviceMotion API は加速度を取れるが、二重積分で距離を出すと誤差が秒単位で累積し実用精度は数秒が限界。車載ナビはジャイロ+車速パルスで補正するがブラウザにはそれがない。代わりに「最後に取得した位置にマーカーを残し、lost アイコンに切り替える」設計とする
- **再検討時期**: Phase 2（ネイティブアプリ化でセンサー融合が使えるようになった段階）

## D-019: accuracy値ベースの位置精度管理（2系統並走の廃止）

- **決定（改訂）**: PositionQuality を 'active' | 'lost' | 'denied' の3状態で管理する。2系統並走は廃止済み（変更なし）。watchPosition 1本（enableHighAccuracy: true）で運用し、accuracy 値で精度を表示する
- **3状態の定義**:
  - active: watchPosition から位置情報を受信中
  - lost: 適応的閾値（後述）の時間 watchPosition から結果なし
  - denied: ブラウザが位置情報の権限を拒否（GeolocationPositionError.PERMISSION_DENIED）
- **適応的 lost 閾値（D-028 参照）**: 固定15秒ではなく、直近の更新間隔実績から動的に算出する
- **旧版からの変更点**: stale / acquiring の中間状態を廃止。3状態に統一
- **理由**: ブラウザ Geolocation API は enableHighAccuracy をヒントとして受け取るだけで、実際の測位手段（GPS / Wifi / IP）をアプリに通知しない。enableHighAccuracy: true でも Wifi/IP ベースの値が返る場合があり、2系統並走で測位手段を判別する設計前提が崩れた。accuracy の値で精度を管理すれば十分
- **却下**: 2系統維持し positionQuality を highAccuracy/lowAccuracy に読み替え → 測位手段が判別できない以上、2本の watchPosition を維持する複雑さに見合うメリットがない

## D-020: ルート編集画面からGPSを完全除去

- **決定**: ルート編集画面で Geolocation API を一切使用しない。GPS（watchPosition）はナビゲーション画面（1-6）でのみ使用する。ルート編集画面の初期センタリングは lastKnownPosition（localStorage）で行う
- **理由**: PCでのルート編集時にGPSは不要。デスクトップPCでは watchPosition の更新間隔が長く（30秒〜数分）、15秒の lost 判定閾値で active/lost が繰り返される問題が発生した。ナビゲーション中のみ GPS を使う設計がシンプルで、位置情報の権限ダイアログもルート編集時には出なくなる
- **却下**: LOST_THRESHOLD を長くする / maximumAge でキャッシュ許容 → 根本的にルート編集にGPSが不要なので対症療法は不適切

## D-021: Google Maps Platform のコスト戦略

- **決定**: 段階的移行モデルを採用する。初期はFlexRouteの共有APIキーで運営し、ユーザー増加に応じて個人APIキーへの移行を案内する。個人APIキーを使うユーザーはGoogle Maps Platformの無料枠内で利用でき、APIコストがゼロになる
- **理由**: FlexRouteの想定ヘビーユーザーの月間利用は全SKUで無料枠の6〜20%しか消費せず、個人が通常利用で無料枠を使い切ることは現実的にありえない。1ユーザーの月間コスト試算（全SKU合計）は無料枠内に余裕で収まる
- **規約確認**: Google Maps Platform ToS Section 3.2.1(c)(ii)「avoid incurring Fees」条項を精査。各ユーザーが自分のGoogle Cloudアカウントで自分のためにAPIを使う形態は、回避すべきFeesがそもそも存在しないため規約違反ではない
- **技術的制約**: 請求先アカウント作成とカード登録はAPI自動化不可（Google Cloud Console手動のみ）。クイックセットアップURL（https://console.cloud.google.com/google/maps-apis/start）で手順を短縮可能
- **無料枠超過防止**: FlexRouteのローカルカウンタ + Cloud Monitoring API同期で管理。ユーザーに課金が発生する可能性をゼロにする設計
- **却下**: FlexRouteの1キーで全ユーザーを賄いサブスクで回収 → 1,000ユーザーで月170万円、採算が困難
- **却下**: OAuth自動セットアップ → 請求先アカウント作成がAPI不可のため技術的に実現不能
- **詳細**: strategy/PERSONAL_APIKEY_STRATEGY.md, strategy/API_COST_ANALYSIS.md

## D-022: Routes API は Pro SKU（TRAFFIC_AWARE）を継続使用

- **決定**: Routes API の TRAFFIC_AWARE 設定（Pro SKU, $10/1,000）を維持する。Essentials（$5/1,000）への切替は行わない
- **理由**: 個人APIキー戦略（D-021）により、APIコストはユーザー個人の無料枠内に収まる。Pro SKU の無料枠5,000回/月に対し、想定利用は890回/月（18%）で十分な余裕がある。コスト削減のために交通情報を犠牲にする必要がない
- **再検討条件**: 個人APIキー戦略を断念し、FlexRoute共有キーで運営する方針に変更した場合

## D-023: ナビゲーションのオートズーム方式

- **決定**: 時間先読みモデル（方式B）をベースラインとし、ターン接近ズーム（方式D）をオーバーレイとして組み合わせる
- **ベースライン（方式B）**: 「現在速度で走ったとき、画面上端に15秒後の地点が見える」ズームレベルを計算する。速度が変わればズームが連続的に変化し、固定テーブル方式より自然な挙動になる
- **オーバーレイ（方式D）**: 次のステップ（案内指示）までの距離が300m以下になったらズームイン開始。100m以下で最大ズーム（ベースライン+2レベル、上限z18）。ステップ通過後にベースラインに復帰。ズーム変化は0.5秒アニメーションで滑らかに遷移
- **根拠**: 一般ナビアプリの調査結果。OsmAnd（オープンソース）は方式Bで20〜45秒先を表示。Google Maps・MRA・Garminは方式A（速度テーブル）+方式D（ターン接近）を採用。FlexRouteはSavedRouteStepに全ステップの距離・案内文が保存済みのため方式Dとの相性が良い
- **却下**: 方式A（固定速度テーブル）単体 → 速度帯の境界でズームがジャンプする。方式C（道路種別考慮）→ 実装複雑度が高い割にPhase 1では十分なデータがない

## D-024: 鳥瞰図（tilt）のナビ画面対応

- **決定**: ナビ画面のヘッディング制御にtilt（傾斜角）の切替を追加する。headingUpモードでtilt 45°を選択可能にする。デフォルトはtilt 0°（2D俯瞰）。ユーザーがUIから切り替える
- **前提**: FlexRouteはベクターマップ（Map ID付き）を使用しており、Google Maps JavaScript APIのsetTilt() / moveCamera()が利用可能。追加APIコストなし
- **制約**: tiltの最大値はズームレベルに依存する。ナビ中のズーム（z13〜z17）では45°は問題なし

## D-025: 林道・峠道の分岐視認性（未解決課題）

- **決定**: 現時点では対策なしとし、課題として記録する
- **問題**: Routes APIが「直進」と判断した区間では案内指示（ステップ）が生成されない。林道・峠道で分岐が地図上に見えていてもナビ的には「長い直進区間の途中」となり、ターン接近ズーム（D-023の方式D）が発動しない
- **影響シーン**: 林道の分岐、峠道のY字路で案内指示が生成されないケース
- **検討済みアプローチ**: ポリライン角度分析（カーブと分岐の区別不能）、道路種別による常時ズーム補正（roadType: 'local'で+1〜2レベル）
- **再検討時期**: Phase 1の実走テスト後に、実際の問題頻度を評価して判断

## D-026: tracking（非ナビ中GPS記録）のスコープ

- **決定**: 全画面（TOP・ルート編集・ナビ）でバックグラウンドGPS記録を実行する。UIには現在地マーカーやGPSロスト表示は出さない。watchPositionはアプリ起動時に開始し、位置データはGpsLogに蓄積のみ行う
- **D-020との整合性**: D-020の意図は「ルート編集画面にナビ用GPS UI（現在地マーカー・GPSロストアラート・追従モード）を出さない」であり、バックグラウンドのデータ記録は対象外。初回起動時のブラウザ位置情報許可ダイアログは許容する
- **理由**: クモの巣走破地図（F-SPIDER）のデータ蓄積には、ナビ中だけでなく全移動記録が重要。ナビを使わない散策・ドライブでも走行記録が残る

## D-027: 道路スナップ方式（暫定）

- **決定**: Phase 1 では保存済みルートポリライン上の最近点にスナップする。Google Roads API（Snap to Roads）は使用しない
- **理由**: Roads API の Snap to Roads（SKU: Roads - Route Traveled, Pro カテゴリ）はリアルタイムスナップで月間 24,000 回（1点/3秒 × 20時間/月）に達し、無料枠 5,000 回の 480% を消費する。10点バッチなら無料枠内だが 10 秒間スナップが遅延しリアルタイムナビとして不自然
- **暫定仕様の制約**: ルートから大きく離れている場合（逸脱判定閾値 50m 超）はスナップしない。逸脱中は生の GPS 座標をそのまま表示する
- **ステータス**: 暫定仕様。Phase 2（ネイティブアプリ化で GPS 精度向上）で再検討
- **再検討条件**: ネイティブアプリの GPS 精度でスナップの必要性が低下する可能性、Roads API の価格改定、バッチ方式の UX 評価
- **Step 3 での拡張検討**:
  - (a) GPS の accuracy 値を活用した動的スナップ閾値（固定50m → accuracy × N に伸縮）
  - (b) 逸脱中（ポリラインスナップ OFF 時）に Snap to Roads API を散発的に呼び出し、マーカーを道路上に維持する。呼び出しはイベント駆動（逸脱検知時・逸脱中の定期更新・リルート完了時）でコストを抑制。Phase 2 でサーバーサイド API キー管理が前提

## D-028: 適応的 lost 閾値

- **決定**: lost 判定の閾値を固定値ではなく、直近の watchPosition 更新間隔の実績から動的に算出する
- **アルゴリズム**:
  - 直近10回の更新間隔をリングバッファに記録
  - 中央値（median）を算出
  - lost 閾値 = median × 3
  - 下限: 10秒（スマホで GPS が安定していても短すぎる判定を防ぐ）
  - 上限: 120秒（PC で更新間隔が極端に長い場合の歯止め）
  - 初回（データ不足時）: デフォルト 15秒で開始。10回分のデータが溜まったら適応値に切り替え
  - ナビ開始時にリングバッファをクリア
- **理由**: デスクトップPC の Wifi/IP 測位は更新間隔が30秒〜数分で、固定15秒では active/lost が繰り返される（D-020 で発見された問題と同構造）。スマホ GPS は1〜3秒間隔。デバイス差を吸収するには固定値では不可能
- **却下**: maximumAge を緩める → 同じ位置を繰り返し返すだけで本質的解決にならない。デバイス判定（maxTouchPoints）→ タブレットや外部モニタで誤判定のリスク

## D-029: SensorBridge アーキテクチャ — browser API パッチ方式

- **決定**: sim（センサーシミュレーション）は browser API をパッチして PG に割り込む。PG のコードに sim の痕跡を残さない
- **3原則**:
  1. PG は browser API を直接呼ぶ。sim の存在を知らない
  2. sim は browser API をパッチして割り込む。PG のコードに痕跡を残さない
  3. sim は原因（callback パターン）を再現する。結果（PG の状態）を直接操作しない
- **却下**: Provider 注入方式（PG が抽象インターフェース経由で API を呼ぶ）→ sim のための抽象を PG に強制する。sim が削除された後も抽象が残る
- **却下**: SensorBridge resolve 方式（handlePosition 内で値をマージ）→ sim が PG の状態遷移マシンを間接的に操作する問題が解消できない
- **パッチパターン分類**:
  - Watch 型: callback 登録→定期呼び出し（例: geolocation）
  - Event 型: addEventListener パッチ→fake event dispatch（例: deviceorientation）
  - Request 型: 単発の Promise/戻り値差し替え（例: wakeLock）
  - Property 型: getter パッチ→読み取り値差し替え（例: navigator.onLine）
- **インストールタイミング**: main.tsx で React render 前に実行。?debug パラメータがある場合のみ
- **根拠**: Playwright、Cypress 等のテストフレームワークが sensor を mock する時と同じ手法

## D-030: sim の callback 配信方式 — タイマーベース

- **決定**: position sim 中は simGeolocation が一定間隔のタイマーで PG の success callback を呼ぶ。interval / sync / lost の3モードを提供
- **3モード**:
  - sync: 操作のたびに即座に callback（操作の応答性優先）
  - interval: タイマーの次の tick で配信（GPS の real 挙動に近い）
  - lost: タイマーの tick を空振りさせ callback を送らない（PG の lostTimer が自然発火）
- **理由**: 旧方式（positionQuality を直接操作）は「結果を操作する」設計であり、D-029 の原則3に違反していた。タイマーベースなら sim は callback の発生パターンのみを制御し、PG の状態判断は PG 自身に委ねられる
- **denied 模擬**: error callback を PERMISSION_DENIED で呼ぶ。PG は自分で clearWatch + deniedRetry に入る。patchedGetCurrentPosition が denied 中は fake error を返し続ける
- **heading / speed**: GPS の測位データの一部なので interval に従う。sync チェックボックスで即時反映も可能（操作の便宜）
- **accuracy**: interval に委ねる（独立したセンサーではなく GPS 測位データの一部）

## D-031: heading 融合アーキテクチャ（スケルトン定義、将来実装）

- **決定**: PG が GPS heading と磁気 heading を統合する抽象化レイヤー（useHeadingFusion）を持つ。sim は browser API をパッチするだけで、抽象化レイヤーには触れない
- **GPS heading**: GeolocationPosition.coords.heading。移動中のみ有効。約1Hz
- **磁気 heading**: DeviceOrientationEvent.alpha。静止中も動作。約60Hz
- **融合ロジック（将来実装）**: speed > 閾値 → GPS 優先、speed ≈ 0 → 磁気 heading、遷移区間 → ブレンド
- **sim の対応**: geolocation sim の heading（interval ベース）と deviceOrientation sim の magneticHeading（リアルタイム）を独立に操作。リモコン UI も別セクション
- **現状**: useHeadingFusion.ts はスケルトン（何もしない）。GPS heading がそのまま使われる
- **却下**: 抽象化レイヤーをパッチする方式 → 融合ロジック自体のテストができない。PG の内部インターフェースに sim が依存する

## D-032: 地図回転の heading 制御 — React props 方式

- **決定**: 地図の heading は Map コンポーネントの heading prop で制御する。map.setHeading() の命令的呼び出しは使わない
- **理由**: @vis.gl/react-google-maps ライブラリは heading を含むカメラパラメータを React props で管理する設計。命令的な map.setHeading() はライブラリの内部状態管理と衝突し、値が上書きされて反映されない問題が発生した
- **副次効果**: heading 制御が followMode（auto/free）に依存しなくなった。headingUp モードでは地図を手動操作中でも地図が回転する
- **0°/360° 境界問題**: CSS transition が最短回転方向を選べないため、shortestDelta() で連続値に変換。NavigationScreen、HeadingButton、CurrentLocationMarker の3箇所に適用

## D-033: F-LOG v2 — フライトレコーダー方式

- **決定**: ログ基盤を「常時全レベル構造化記録 + 参照時フィルタ」のフライトレコーダー方式に再設計する。トラブルシュートは「記録した入力を sim に流して再現し、再現時に詳細トレースを出力する」3層構造で行う

### 検討経緯

#### 問題の発見

v1.6.43 時点の精査で以下が判明:

- ナビゲーション / sim 関連コード（useNavGeolocation, useLostTimer, useRouteSnap, simGeolocation, simChannel, navigationStore, sensorStore の7ファイル）に logService の呼び出しがゼロ。最も複雑なコードが完全に無言
- DebugPanel は import.meta.env.DEV でガードされており、本番ビルド（GitHub Pages）ではログを閲覧する手段がない
- フィールドテスト（スマホでの走行テスト）でログを回収する仕組みがない。ページリロードでメモリ上のリングバッファが消失する

#### ログレベルの役割に関する考察

「常にバグレポートのために詳細な情報を記録しておくべきではないか」という問いが出発点。ログレベルを「記録時のフィルタ（何を書くか）」ではなく「参照時のフィルタ（何を見るか）」として扱う方が合理的ではないか。

ただし、全ての分岐経路をトレースレベルで常時記録すると、コードの半分がログ呼び出しになる（コード汚染問題）。性能問題ではなくメンテナンス問題が支配的。

#### 実測による定量分析

3つの記録方式のコストを10万エントリで実測:

- (A) 文字列 + new Date().toISOString(): 583ms — ボトルネックは文字列構築と Date
- (B) 構造化数値 + performance.now(): 46ms — 文字列を作らなければ 12.6x 高速
- (C) レベルゲートで全スキップ: 0.9ms

FlexRoute の実際のデータ発生レートは GPS 1Hz + 散発的状態遷移で秒あたり約 1-2 エントリ。構造化記録 (B) の場合、1エントリ 0.46µs に対し 60fps のフレーム予算は 16,670µs。CPU 占有率 0.003%。メモリは 10,000 エントリで 730KB。**常時全記録が事実上ゼロコスト**であることが実測で確認された。

GPS 1回受信で走る処理チェーン全体を if 分岐レベルでトレースすると約 29 trace points/sec（将来の Step 2-5 追加で 50-80 に膨張）。CPU コストは依然として無視できるが、150行ルールの中で半分がログコードになる**コード汚染**が持続不可能。

#### 業界の定石: クライアントサイドのトラブルシュート

大量のコンシューマ向けクライアントサイドアプリケーション（スマホアプリ、ブラウザアプリ）では、全分岐トレースを常時記録しているプロダクトは存在しない:

- **Sentry Breadcrumbs**: 主要イベント+状態変更のみ構造化記録。クラッシュ時にダンプ
- **Android Logcat**: カーネルリングバッファに常時記録、logcat でレベルフィルタ
- **Java Flight Recorder (JFR)**: 1%未満のオーバーヘッドで構造化イベントを常時記録
- **iOS Crashlytics**: 入力イベント + 状態スナップショット
- 共通原則: **構造化 data in → フォーマット text out（遅延評価）**

航空業界のフライトレコーダー（ブラックボックス）も同じ思想: 記録するのは操縦入力・エンジンパラメータ・気象データ（外部入力と計器値）。油圧バルブの個々の開閉状態（内部分岐）は記録しない。事故調査では記録データをシミュレーターに流し込んで再現し、そこで初めて内部状態を追う。

#### FlexRoute の sim がリプレイデバイスになる

D-029 の3原則（PG は sim を知らない / sim は API パッチ / sim は callback パターンを再現）により、sim 経由で GPS 座標列を流し込めば、useNavGeolocation → useLostTimer → navigationStore → useRouteSnap という処理チェーンが本番と同一のコードパスを走ることが保証されている。

これにより「Bug レポートの GPS 座標列を sim replay で再生し、?log=trace で全分岐を追う」というトラブルシュート手法が成立する。sim は開発テスト用に構築したものだが、事実上のリプレイデバイスとして機能する。

### 確定した方針

#### 3層構造

| 層 | 稼働タイミング | 対象者 | 役割 |
|---|---|---|---|
| Layer 1: FlightRecorder | 常時（全ユーザー） | 自動 | 外部入力・状態遷移結果・判定結果を構造化記録 |
| Layer 2: sim 再現 | 事後（開発者） | 手動 | Bug レポートの GPS 座標列を sim に流して処理チェーンを再現 |
| Layer 3: 詳細トレース | sim 再現時のみ | 開発者 | ?log=trace + DevTools で全分岐・変数値を追跡 |

#### FlightRecorder（Layer 1）の記録対象

記録するもの（〜6 entries/sec）:

- **外部入力**: GPS {lat, lng, heading, speed, accuracy} — 1Hz
- **状態遷移の結果**: positionQuality の遷移（active→lost 等）、followMode/zoomMode/headingMode の変更
- **判定結果**: snap 距離と成否、lost 閾値算出値、ステップ通過判定、逸脱距離、オートズーム算出値（Step 2-5 で追加されるものも含む）
- **ユーザー操作**: ボタンタップ、地図ドラッグ、モード切替
- **warn/error**: API 失敗、permission denied、例外

記録しないもの:

- 個々の if 文の分岐経路
- ループ内の中間値
- React render の詳細

#### 記録フォーマット

- **記録時**: 構造化データ（数値 + enum 番号）。文字列を生成しない。タイムスタンプは performance.now()
- **参照時**（DebugPanel 表示 / Bug レポートダンプ時）: enum→文字列、performance.now()→ISO時刻 に変換

#### ログレベルの役割

- 5段階: trace(0), debug(1), info(2), warn(3), error(4)
- **記録**: 全レベルを常時記録。レベルによる記録フィルタなし
- **参照**: ?log パラメータで「コンソールに表示するレベル」を制御
  - ?log なし → コンソール出力なし（記録は継続）
  - ?log=warn → warn + error のみコンソール出力
  - ?log=info / ?log=debug / ?log=trace → 指定レベル以上をコンソール出力

#### バッファ設計

- 循環バッファ（O(1) push、shift() 不使用）
- サイズ: 10,000 エントリ（730KB、6 entries/sec で約28分保持）
- logService / userActionTracker / performanceMonitor を統合した単一バッファ（時系列の一本化で因果分析が容易）

#### DebugPanel の表示条件

- ?log または ?debug パラメータ指定時に表示（本番ビルドでも可）
- import.meta.env.DEV 限定を廃止
- レベルフィルタ付き

#### sim replay（Layer 2）

- Bug レポートの GPS 座標列を sim に流し込む再現ツール
- 実装タイミング: 必要になった段階（現時点では未実装）
- sim の callback モード（sync/interval/lost）と denied 状態も再現可能

#### 将来の 60Hz センサー到達時

magneticHeading, deviceMotion 等の 60Hz センサーが実装された段階で、Float64Array ベースの専用高速バッファを別途設計する。メインの FlightRecorder とは独立。Bug レポート時にマージ。

- **却下案1**: 全分岐トレース常時記録 → CPUは問題ないがコード汚染が持続不可能。150行中75行がログになる
- **却下案2**: 入力のみ記録 + 完全な決定論的再現 → タイマー発火タイミング、React renderサイクル、GCスパイク等の非決定的要素を全て記録することは非現実的
- **却下案3**: ログレベルによる記録フィルタ（従来方式）→ バグ発生時に必要なレベルが記録されていない事態が発生する。FlexRoute のデータ発生レートでは常時全記録のコストが事実上ゼロであり、記録フィルタを入れる理由がない

## D-034: バグレポート（Bug ボタン）

- **決定**: ナビゲーション画面に Bug ボタン（FAB）を常時表示し、押下時にスクリーンショット + FlightRecorder ダンプ + メタ情報をバンドルして回収する
- **Phase 1（実装済み）**: JSON 単一ファイルとしてダウンロード。screenshot は base64 data URL として JSON に埋め込み。JSZip ライブラリの追加を避けリスクを最小化
- **Phase 2**: zip 形式に拡張（JSZip 導入で screenshot.png を分離）、またはサーバアップロード（presigned URL → S3）
- **スクリーンショット**: html2canvas を動的 import（通常のバンドルサイズに影響なし）
- **バンドル内容**: flexroute-bug-{timestamp}.json に screenshot(base64), entries(全エントリ), meta を1ファイルに集約
- **ダンプのフォーマット**: ダンプ時に初めて enum→文字列、performance.now()→ISO 時刻に変換。記録時のゼロコスト原則を維持
- **表示条件**: ナビゲーション画面で常時表示。小さい FAB で走行の邪魔にならないデザイン。?log や ?debug の有無に関係なく使用可能
- **理由**: フライトレコーダーが常時記録しているため、?log パラメータなしで走行テストしていても、Bug ボタンを押せば過去約28分の詳細データが回収できる
- **却下**: sessionStorage 永続化 → Bug ボタンの運用で代替可能。リロード前に Bug ボタンさえ押せばログは回収できる

## D-035: followMode=auto 時のホイールズーム制御

- **決定**: followMode=auto 時に Google Maps のネイティブ wheel ズームを scrollwheel: false で無効化し、normalize-wheel で正規化したステップでマーカーピボットズームを行う。followMode=free 時は Google Maps のネイティブ動作を維持
- **ピボット計算**: newCenter = marker + (oldCenter - marker) x 2^(oldZoom - newZoom) でマーカーの画面上ピクセル位置を不変に保つ。setZoom + setCenter の2呼び出しでアニメーション付きズームを実現
- **ステップ計算**: normalize-wheel で deltaY をデバイス間で正規化し、Math.max(-1, Math.min(1, -normalizedPixelY / 400)) でクランプ。1ノッチ ≈ +/-0.25 ズームレベル
- **デバイス間差異**: normalize-wheel ライブラリ（Facebook製）で deltaMode（PIXEL/LINE/PAGE）の差とブラウザ間の倍率差を吸収。クランプで高精度マウスのフリースピン暴走を防止
- **余韻カット**: ホイール停止後 150ms の debounce で moveCamera を呼び出し、Google Maps の setZoom が内部で持つアニメーション余韻を即時停止する
- **+/- ボタン**: ZoomInOutButtons.tsx に配置。idle イベントチェーンによる長押し加速を実装。zoomStepFactor でズームレベルに応じたステップ補正（高ズーム時は細かく、低ズーム時は大きく）
- **pivotZoom 共有**: NavMapController.tsx から export した pivotZoom 関数を、ホイールと +/- ボタン（P モード）の両方で共有使用。ズーム挙動の一貫性を保証
- **P/N モードトグル**: ZoomInOutButtons に P（pivot-fine）/ N（native）の切替を配置。P はマーカーピボットズーム、N は Google Maps ネイティブ。将来の動作比較・デバッグ用に N モードを保持
- **理由**: Google Maps のネイティブ wheel ズームはマウスカーソル位置をピボットにするため、followMode=auto でもカーソルが画面中央から離れていると center がずれる。ナビの「自由なZOOM率のまま現在地マーカーを中心に維持する」要件に反する
- **却下案1**: zoom_changed 内で即座に panTo → ズームアニメーション中の panTo 競合リスク（D-032 の教訓）
- **却下案2**: ホイールズームで followMode=free に切り替え → 「自由なZOOM率のまま現在地マーカーを中心に維持」要件を満たさない
- **却下案3**: 偽 WheelEvent をマーカー座標で dispatch → isTrusted=false、scrollwheel true/false 切替のタイミング問題
- **却下案4**: moveCamera({center, zoom}) → アニメーションなしでカクカクする
- **却下案5**: 自前 deltaY 正規化（deltaMode 変換のみ）→ ブラウザ間の微妙な倍率差を吸収できない。normalize-wheel が業界標準
- **scrollwheel 一元化（v1.6.66）**: scrollwheel の設定を NavMapController に一元化。方法B（カスタムイベント）を採用。ZoomInOutButtons の P/N トグルから map.setOptions({ scrollwheel }) を削除し、window.dispatchEvent(new Event("wheelmode-changed")) のみ発火する形に変更。NavMapController 側で wheelmode-changed イベントリスナーを追加し、scrollwheel 設定を再評価する。SPORADIC-001（P モードでホイールが突然効かなくなる）の原因候補だった scrollwheel 二重管理を解消

