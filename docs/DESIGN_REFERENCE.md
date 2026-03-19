# FlexRoute デザインリファレンス

> 最終更新: 2026-03-19

## 1. 現在地マーカー（最重要）

青い矢印 + 白パルス背景。常にZIndex最上位(100)。
heading連動で回転する。

JSXコード:
```jsx
<AdvancedMarker position={position} zIndex={100}>
  <div className="relative flex items-center justify-center">
    <div className="absolute w-[90%] h-[90%] bg-white/80 rounded-full animate-pulse-fast" />
    <div
      className="w-8 h-8 text-blue-600 relative z-10"
      style={{ transform: `rotate(${heading}deg)`, transition: 'transform 0.3s ease-out' }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <path d="M 50 10 L 85 85 L 50 70 L 15 85 Z" fill="currentColor" stroke="white" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
</AdvancedMarker>
```

## 2. ヘッディング制御アイコン（ヘッドアップ/ノースアップ切替）

w-14 h-14 の丸ボタン内に表示。

### ヘッドアップモード時（コンパス回転表示）
方位に応じて回転する。赤い上三角 + グレー下三角のコンパスデザイン。

ボタンの共通クラス: `bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14`

内部SVG:
```jsx
<div className="relative w-14 h-14">
  <div
    className="w-full h-full transition-transform duration-300 ease-out p-1"
    style={{ transform: `rotate(${-mapHeading}deg)` }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M 50 8 L 65 48 L 35 48 Z" fill="#ef4444" />
      <path d="M 50 92 L 35 52 L 65 52 Z" fill="#cbd5e1" />
    </svg>
  </div>
</div>
```

### ノースアップモード時（N + 三角表示）
赤い三角の下に大きなNの文字。

内部JSX:
```jsx
<div className="w-full h-full flex flex-col items-center justify-center">
  <svg viewBox="0 0 100 100" className="w-8 h-6 mb-0">
    <path d="M 50 8 L 75 83 L 25 83 Z" fill="#ef4444" />
  </svg>
  <span className="text-2xl font-black text-slate-800 leading-none mt-[-4px]" style={{ fontFamily: 'sans-serif' }}>N</span>
</div>
```

## 3. ズーム制御アイコン（Auto/Lock切替）

w-14 h-14 の丸ボタン。中央に Auto/Lock テキスト、下部に ZOOM テキスト。
四隅にフォーカス枠のようなL字デザイン。

内部SVG:
```jsx
<div className="w-12 h-12">
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <g stroke="#3b82f6" strokeWidth="4" strokeLinecap="butt" strokeLinejoin="bevel" fill="none">
      <path d="M 12 25 V 12 H 35" />
      <path d="M 88 25 V 12 H 65" />
      <path d="M 8 68 V 86 H 16" />
      <path d="M 90 68 V 86 H 84" />
    </g>
    <text x="50" y="49"
      fill={isLocked ? "#ef4444" : "#4b5563"}
      fontFamily="Arial, sans-serif" fontWeight="900" fontSize="38"
      textAnchor="middle" dominantBaseline="middle">
      {isLocked ? 'Lock' : 'Auto'}
    </text>
    <text x="50" y="87"
      fill="#3b82f6"
      fontFamily="Arial, sans-serif" fontWeight="900" fontSize="19"
      textAnchor="middle" dominantBaseline="middle">
      ZOOM
    </text>
  </svg>
</div>
```

## 4. 追従モード制御アイコン（Center固定/自由移動切替）

w-14 h-14 の丸ボタン。heading連動で回転。

### 中央固定モード（autoFollow = true）
コンパス風の円弧 + 十字線 + 黒い矢印。下部に CENTER テキスト。

SVG:
```jsx
<svg viewBox="0 0 100 100" className="w-full h-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
  <path d="M 15.36 70 A 40 40 0 1 1 84.64 70" stroke="currentColor" strokeWidth="4" className="text-blue-500" opacity="0.8" />
  <path d="M 50 0 V 15 M 0 50 H 15 M 100 50 H 85" stroke="currentColor" strokeWidth="4" className="text-blue-500" />
  <path d="M 50 27 L 33 69 L 50 64 L 67 69 Z" fill="currentColor" className="text-slate-800" />
  <text x="50" y="88" fill="#3b82f6" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" dominantBaseline="middle" stroke="none">CENTER</text>
</svg>
```

### 自由移動モード（autoFollow = false）
上・左・右に矢印（移動可能を示唆）+ 赤い矢印。下部に CENTER テキスト。

SVG:
```jsx
<svg viewBox="0 0 100 100" className="w-full h-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
  <g className="text-blue-500" stroke="currentColor" strokeWidth="4">
    <path d="M 50 17 V 0 M 37.5 12.5 L 50 0 L 62.5 12.5" />
    <path d="M 17 50 H 0 M 12.5 37.5 L 0 50 L 12.5 62.5" />
    <path d="M 83 50 H 100 M 87.5 37.5 L 100 50 L 87.5 62.5" />
  </g>
  <path d="M 50 27 L 33 69 L 50 64 L 67 69 Z" fill="#ef4444" />
  <text x="50" y="88" fill="#3b82f6" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" dominantBaseline="middle" stroke="none">CENTER</text>
</svg>
```

## 5. ナビゲーションヘッダー

ナビ中に画面上部に表示。エメラルドグリーン背景。

JSX:
```jsx
<div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl max-w-sm backdrop-blur-md bg-opacity-95 border border-emerald-500/50 flex items-center gap-4">
  <button className="p-2 hover:bg-white/20 rounded-xl transition-colors" title="ナビを終了">
    <ArrowLeft className="w-6 h-6" />
  </button>
  <div className="flex flex-col">
    <div className="flex items-center mb-1">
      <span className="font-bold text-lg tracking-tight">ナビゲーション中</span>
    </div>
    <div className="flex gap-6 text-emerald-50">
      <div>
        <div className="text-[10px] uppercase opacity-80 font-medium leading-none mb-1">到着予想</div>
        <div className="font-mono text-lg leading-none">{duration}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase opacity-80 font-medium leading-none mb-1">距離</div>
        <div className="font-mono text-lg leading-none">{distance}</div>
      </div>
      <div className="pl-4 border-l border-emerald-400/30">
        <div className="text-[10px] uppercase opacity-80 font-medium leading-none mb-1">速度</div>
        <div className="font-mono text-xl font-black text-white leading-none">{speed}<span className="text-[10px] ml-0.5">km/h</span></div>
      </div>
    </div>
  </div>
</div>
```

## 6. トップ画面タブ切替

タブバー: bg-slate-200/70 の背景にpillスタイル。
アクティブタブ: bg-white text-indigo-600 shadow-sm。
非アクティブ: text-slate-500。

JSX:
```jsx
<div className="flex bg-slate-200/70 p-1 rounded-xl shadow-inner">
  <button className="px-5 py-2 rounded-lg text-sm font-bold transition-all bg-white text-indigo-600 shadow-sm">
    ルート
  </button>
  <button className="px-5 py-2 rounded-lg text-sm font-bold transition-all text-slate-500 hover:text-slate-700">
    ラベル
  </button>
  <button className="px-5 py-2 rounded-lg text-sm font-bold transition-all text-slate-500 hover:text-slate-700">
    場所
  </button>
</div>
```

## 7. タイル/リスト切替トグル

タブバーと同じpillスタイル。lucide-react の LayoutGrid / List アイコン使用。

JSX:
```jsx
<div className="flex bg-slate-200/70 rounded-xl p-1 shadow-inner">
  <button className="p-2 rounded-lg transition-all bg-white shadow-sm text-indigo-600">
    <LayoutGrid className="w-4 h-4" />
  </button>
  <button className="p-2 rounded-lg transition-all text-slate-500 hover:text-slate-700">
    <List className="w-4 h-4" />
  </button>
</div>
```

## 8. 新規作成ボタン

JSX:
```jsx
<button className="bg-indigo-600 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-500 transition-colors flex items-center text-sm">
  <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
  <span className="hidden sm:inline">新規作成</span>
</button>
```

## 9. ナビコントロールボタン共通スタイル

全て w-14 h-14 の丸ボタン、右端に縦並び。

共通クラス: `bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14`

配置: 画面右側に `flex flex-col gap-3 items-end` で縦並び。
順序（上から）: ヘッディング → ズーム → 追従モード

## 10. ルート編集サイドバー全体

- サイドバー: `w-96 bg-white shadow-2xl flex flex-col h-full`
- ヘッダー: `bg-indigo-600 text-white p-6`（モバイル時 `p-4 pt-2`）

## 11. ルート名入力欄

- `bg-indigo-700/50 text-white placeholder-indigo-300 border border-indigo-500/50 rounded-xl p-3 font-bold`
- `focus:outline-none focus:ring-2 focus:ring-white/50`

## 12. RouteSummary

- コンテナ: `bg-indigo-700/50 rounded-xl p-4 backdrop-blur-sm border border-indigo-500/30`
- ラベル「ルート概要」: `text-indigo-100 text-sm font-medium uppercase tracking-wider`
- 距離・時間: `text-2xl font-bold`（白）
- 副テキスト: `text-indigo-200 text-sm`
- ナビ開始ボタン: `bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30`
- 無効時: `bg-slate-500/50 text-slate-300 cursor-not-allowed`
- 計算中: `text-indigo-200 text-sm animate-pulse`
- エラー: `text-red-300 text-xs`

## 13. 確認ダイアログ

- オーバーレイ: `fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm`
- カード: `bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl`
- メッセージ: `text-lg font-bold text-slate-800`
- キャンセルボタン: `px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100`
- 削除ボタン: `px-4 py-2 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30`

## 14. 検索モーダル

- オーバーレイ: `fixed inset-0 z-50 backdrop-blur-sm bg-slate-900/40`
- カード: `bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-200`
- ヘッダー: `p-4 border-b border-slate-100 bg-slate-50`
- タイトル: `font-bold text-slate-800` + Search アイコン（`text-indigo-500`）
- 閉じるボタン: `p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full`

## 15. 検索入力欄

- `bg-white border border-slate-200 rounded-xl p-3`
- `focus:ring-2 focus:ring-indigo-500 focus:outline-none`
- プレースホルダー: `text-slate-400`

## 16. 検索結果リスト

- 各候補: `p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100`
- 場所名: `font-medium text-slate-800`
- 住所: `text-sm text-slate-500`

## 17. カード共通（RouteCard / LabelCard / PlaceCard）

- リスト行共通（3タブ共通）:
  - 外枠: `bg-white border border-slate-300 rounded-2xl hover:shadow-xl transition-shadow pr-3 text-left flex items-center gap-3`
  - サムネ領域: `w-24 h-16 rounded-l-2xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center`
    - ルート: 地図サムネイル画像 / Map アイコン（フォールバック）
    - 場所: 施設写真 / MapPin アイコン（フォールバック）
    - ラベル: カラーサークル（w-8 h-8）
  - テキスト: `flex-1 min-w-0`
  - 削除ボタン: テキストの外に兄弟配置、`p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors`
- タイル表示: `bg-white border border-slate-300 rounded-2xl hover:shadow-xl cursor-pointer flex flex-col overflow-hidden`
- ルート名: `font-bold text-lg text-slate-800`（タイル）/ `text-base`（リスト）
- 名称未設定時: `text-slate-400 italic` で「名称未設定」表示

## 18. 空状態メッセージ

- コンテナ: `text-center text-slate-500 py-8 bg-slate-50 rounded-xl border border-slate-100`
- テキスト: 「保存されたルートはありません。」等

## 19. TOP画面ヘッダー

- `bg-indigo-600 text-white p-6`
- アプリ名: `text-2xl font-bold tracking-tight`

## 20. ローディングスピナー

- `w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin`

## 21. GPS アイコン（ナビヘッダー内）

ナビヘッダーの「ナビゲーション中」テキスト右側に配置。
円形背景（40×40px）+ SVG（36×36px, viewBox 0 0 60 60）で構成。
タップでポップオーバー表示。

### 色マッピング

| ステータス | stroke/fill色 | 円背景 | 円ボーダー |
|-----------|--------------|--------|-----------|
| active | #059669 | rgba(16,185,129,0.12) | rgba(16,185,129,0.5) |
| lost | #d97706 | rgba(245,158,11,0.12) | rgba(245,158,11,0.5) |
| denied | #dc2626 | rgba(239,68,68,0.1) | rgba(239,68,68,0.45) |

### 値テキストのルール

- active: 精度（m）。Math.round(accuracy)。99以下は `{n}m`、100以上は `99+`
- lost: 経過秒数。lostSince からの秒数（Math.floor）。99以下は `{n}s`、100以上は `99+`
- denied: `拒否`（固定）

### 点滅アニメーション

lost と denied で値テキスト + 下部ラインが点滅する（CSS animation、GPU処理）。

```css
@keyframes statusBlink {
  0%, 49.9% { opacity: 1; }
  50%, 100% { opacity: 0.3; }
}
```

周期: 1秒、step-end、infinite。active は点滅しない。

### active 状態の SVG

```jsx
<svg width="36" height="36" viewBox="0 0 60 60" fill="none">
  {/* 衛星全体のグループ（位置調整） */}
  <g transform="translate(15,11.5)">
    {/* 衛星パーツ（-45°回転 + 0.383倍縮小） */}
    <g transform="rotate(-45) scale(0.383)" stroke="#059669">
      {/* 本体（円筒を正面から見た楕円） */}
      <ellipse cx="0" cy="0" rx="5" ry="8" strokeWidth="1.5" fill="none"/>
      {/* 左パネル接続棒 */}
      <line x1="-5" y1="0" x2="-8" y2="0" strokeWidth="1.5"/>
      {/* 左ソーラーパネル外枠 */}
      <rect x="-26" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
      {/* 左パネル2分割線 */}
      <line x1="-17" y1="-6" x2="-17" y2="6" strokeWidth="1.5"/>
      {/* 右パネル接続棒 */}
      <line x1="5" y1="0" x2="8" y2="0" strokeWidth="1.5"/>
      {/* 右ソーラーパネル外枠 */}
      <rect x="8" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
      {/* 右パネル2分割線 */}
      <line x1="17" y1="-6" x2="17" y2="6" strokeWidth="1.5"/>
      {/* アンテナ（本体中心から下方向への直線） */}
      <line x1="0" y1="8" x2="0" y2="18" strokeWidth="1.5"/>
    </g>
  </g>
  {/* GPSテキスト（衛星の右） */}
  <text x="37" y="14.5" textAnchor="middle" dominantBaseline="central"
    fill="#059669" fontSize="13" fontWeight="500" fontFamily="sans-serif">GPS</text>
  {/* 精度値テキスト（動的: {accuracy}m / 99+） */}
  <text x="30" y="34" textAnchor="middle" dominantBaseline="central"
    fill="#059669" fontSize="27" fontWeight="500" fontFamily="sans-serif">5m</text>
  {/* 精度矢印の横線 */}
  <line x1="11" y1="51" x2="49" y2="51" stroke="#059669" strokeWidth="1"/>
  {/* 精度矢印の左三角 */}
  <path d="M10 51l3-2.5v5z" fill="#059669"/>
  {/* 精度矢印の右三角 */}
  <path d="M50 51l-3-2.5v5z" fill="#059669"/>
</svg>
```

### lost 状態の SVG

衛星・GPSテキストは active と同一構造で色を #d97706 に変更。
値テキスト + 下部ラインを `<g>` でまとめ、点滅アニメーションを適用。
下部ラインは「実線→破線フェードアウト→右矢印」で経過時間を表現。

```jsx
<svg width="36" height="36" viewBox="0 0 60 60" fill="none">
  {/* 衛星（active と同一構造、色のみ変更） */}
  <g transform="translate(15,11.5)">
    <g transform="rotate(-45) scale(0.383)" stroke="#d97706">
      <ellipse cx="0" cy="0" rx="5" ry="8" strokeWidth="1.5" fill="none"/>
      <line x1="-5" y1="0" x2="-8" y2="0" strokeWidth="1.5"/>
      <rect x="-26" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
      <line x1="-17" y1="-6" x2="-17" y2="6" strokeWidth="1.5"/>
      <line x1="5" y1="0" x2="8" y2="0" strokeWidth="1.5"/>
      <rect x="8" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
      <line x1="17" y1="-6" x2="17" y2="6" strokeWidth="1.5"/>
      <line x1="0" y1="8" x2="0" y2="18" strokeWidth="1.5"/>
    </g>
  </g>
  {/* GPSテキスト */}
  <text x="37" y="14.5" textAnchor="middle" dominantBaseline="central"
    fill="#d97706" fontSize="13" fontWeight="500" fontFamily="sans-serif">GPS</text>
  {/* 点滅グループ: 値テキスト + 下部ライン */}
  <g style={{ animation: 'statusBlink 1s step-end infinite' }}>
    {/* 経過秒数テキスト（動的: {n}s / 99+） */}
    <text x="30" y="34" textAnchor="middle" dominantBaseline="central"
      fill="#d97706" fontSize="27" fontWeight="500" fontFamily="sans-serif">23s</text>
    {/* 下部ライン: 実線→破線フェードアウト→右矢印 */}
    <line x1="11" y1="51" x2="24" y2="51" stroke="#d97706" strokeWidth="1"/>
    <line x1="27" y1="51" x2="31" y2="51" stroke="#d97706" strokeWidth="1"/>
    <line x1="34" y1="51" x2="37" y2="51" stroke="#d97706" strokeWidth="1"/>
    <line x1="39" y1="51" x2="41" y2="51" stroke="#d97706" strokeWidth="1"/>
    <line x1="43" y1="51" x2="44.5" y2="51" stroke="#d97706" strokeWidth="1"/>
    <line x1="46" y1="51" x2="47" y2="51" stroke="#d97706" strokeWidth="1"/>
    <path d="M50 51l-3-2.5v5z" fill="#d97706"/>
  </g>
</svg>
```

### denied 状態の SVG

衛星・GPSテキストは active と同一構造で色を #dc2626 に変更。
値テキスト「拒否」に点滅アニメーションを適用。下部ラインなし。

```jsx
<svg width="36" height="36" viewBox="0 0 60 60" fill="none">
  {/* 衛星（active と同一構造、色のみ変更） */}
  <g transform="translate(15,11.5)">
    <g transform="rotate(-45) scale(0.383)" stroke="#dc2626">
      <ellipse cx="0" cy="0" rx="5" ry="8" strokeWidth="1.5" fill="none"/>
      <line x1="-5" y1="0" x2="-8" y2="0" strokeWidth="1.5"/>
      <rect x="-26" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
      <line x1="-17" y1="-6" x2="-17" y2="6" strokeWidth="1.5"/>
      <line x1="5" y1="0" x2="8" y2="0" strokeWidth="1.5"/>
      <rect x="8" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
      <line x1="17" y1="-6" x2="17" y2="6" strokeWidth="1.5"/>
      <line x1="0" y1="8" x2="0" y2="18" strokeWidth="1.5"/>
    </g>
  </g>
  {/* GPSテキスト */}
  <text x="37" y="14.5" textAnchor="middle" dominantBaseline="central"
    fill="#dc2626" fontSize="13" fontWeight="500" fontFamily="sans-serif">GPS</text>
  {/* 点滅グループ: 値テキストのみ（下部ラインなし） */}
  <g style={{ animation: 'statusBlink 1s step-end infinite' }}>
    {/* 「拒否」テキスト（固定） */}
    <text x="30" y="34" textAnchor="middle" dominantBaseline="central"
      fill="#dc2626" fontSize="27" fontWeight="500" fontFamily="sans-serif">拒否</text>
  </g>
</svg>
```

### ポップオーバー

タップで説明テキストを表示:
- lost: "GPS信号を受信できません（{n}秒経過）"
- denied: "位置情報の使用が許可されていません。ブラウザの設定から位置情報を許可し、ナビを再開始してください"
- active: ポップオーバーなし

### 重要: SVG 座標の厳守

このSVGデザインは1px単位で微調整を重ねて確定したものである。
上記コードブロック内の全座標値を変更してはならない。
実装時はこのコードブロックをそのままコピーし、色を動的に差し替えるだけにすること。
