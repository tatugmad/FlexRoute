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

### active 状態

```jsx
<div className="flex items-center gap-1 text-emerald-200 text-xs">
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <path d="M12 20v-8" />
    <path d="M17 20V8" />
  </svg>
  <span className="font-mono">{accuracy}m</span>
</div>
```

### lost 状態

```jsx
<div className="flex items-center gap-1 text-amber-300 text-xs animate-pulse">
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <line x1="17" y1="8" x2="12" y2="13" />
    <line x1="12" y1="8" x2="17" y2="13" />
  </svg>
  <span className="font-mono">{lostSeconds}s</span>
</div>
```

### denied 状態

```jsx
<div className="flex items-center gap-1 text-rose-300 text-xs">
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <line x1="22" y1="2" x2="2" y2="22" />
  </svg>
  <span>拒否</span>
</div>
```

ナビヘッダーのデザイン（セクション5）の速度表示の右側に配置。
