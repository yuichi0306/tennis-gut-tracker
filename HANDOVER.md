# 引き継ぎ書 — テニスノート

テニスのガット（ストリング）の張り替え履歴・練習時間を記録し、張り替え時期を管理するWebアプリ（旧称「ガット使用歴トラッカー」）。

- **公開URL**: https://yuichi0306.github.io/tennis-gut-tracker/
- **リポジトリ**: https://github.com/yuichi0306/tennis-gut-tracker （パブリック）
- **最終更新**: 2026-09-06
- **参考**: アプリ紹介用に「できることガイド（A4一枚・図解入り・印刷対応）」をClaude Artifactとして作成済み（既定は非公開。リポジトリ外の生成物）。
  URL: https://claude.ai/code/artifact/713f5abb-8c3b-40e5-a3fc-ceec2a1a1a99 （更新するときは、この**URLを `url` に渡して同じ場所を上書き**する。渡さないと別URLの新規ガイドができてしまう）
  **2026-08-10時点の機能まで反映済み**（試合記録・欲しいものリスト・持ち物リスト・ガット寿命の予測・タブの並び替えを含む）。
  ⚠️ **2026-09-06 に追加した「ラケットの購入日」「ラケット・シューズのアーカイブ」「対戦表の保存」はガイド未反映。** 次に更新するときに書き足す。
  A4一枚に収める前提なので、追記したら**用紙からあふれていないか確認する**（1ページ＝約1123px。現状は約10mmの余白）。

---

## 1. 概要

- ラケットを登録し、ガットの張り替え記録（種類・テンション・張り場所）と練習記録（時間）を残す。ラケットには**購入日**も持てる。
- ダッシュボードで、ガット種類ごとの基準に照らして「張り替え時期」を自動判定し、**直近のペースから「次の張り替えはいつ頃か」も予測**する。
- **テニスシューズも登録**でき、練習・試合で選んだ分だけ使用時間が積み上がり「買い替え時期」を判定する。
- ラケット・シューズは**アーカイブ**でき、記録を残したまま一覧や入力欄から外せる（削除ではない）。
- **試合記録**（シングルス／ダブルス・ゲームスコア・勝敗自動判定）を残せる。試合時間はラケット・シューズの使用時間にも加算される。
- **欲しいものリスト**（テニスグッズ）と**合宿の持ち物リスト**（定番プリセット・チェック式）も管理できる。
- データは**ブラウザのlocalStorage**に保存。未ログイン・オフラインでもそのまま動く。
- **Googleログインすると端末間でリアルタイム同期**（Firebase / Firestore）。スマホとPCで同じデータを見られる。
- **PWA対応**。スマホの「ホーム画面に追加」でアプリのように起動でき、オフラインでも動く。
- **ライト／ダークの表示テーマ**に対応（ヘッダーのトグルで切替、OS設定に自動追従）。
- **タブはドラッグで並び替え**でき、よく使う画面を左に寄せられる（並び順はその端末だけに保存）。
- **対戦表は生成すると保存され**、「クリア」を押すまで残る（端末間でも同期）。

---

## 2. 技術スタック

| 分類 | 採用技術 |
|---|---|
| 言語 | TypeScript |
| UI | React 19 |
| ルーティング | react-router-dom v7（`BrowserRouter`） |
| ビルド | Vite 8 |
| スタイル | Tailwind CSS v4（`@tailwindcss/vite`） |
| PWA | vite-plugin-pwa（Workbox） |
| 認証・同期 | Firebase（Google認証 + Cloud Firestore） |
| Lint | oxlint |
| ID採番 | uuid |
| ホスティング | GitHub Pages（GitHub Actionsで自動デプロイ） |

Node.js は 20 以上を想定（CIは20、ローカル検証は24で動作確認済み）。

---

## 3. セットアップと開発

```bash
npm install          # 依存インストール
npm run dev          # 開発サーバー（http://localhost:5173）
npm run build        # 本番ビルド（tsc型チェック + vite build → dist/）
npm run preview      # ビルド結果をローカル確認
npm run lint         # oxlint
```

> **注意（PWAのキャッシュ）**: 一度アクセスするとService Workerがアセットをキャッシュする。
> ローカルで挙動がおかしい時は、ブラウザのDevTools → Application → Service Workers で
> 「Unregister」し、Cache Storage をクリアしてから再読み込みする。

---

## 4. ディレクトリ構成

```
src/
  main.tsx                 エントリ。BrowserRouter + DataProvider でラップ
  App.tsx                  ヘッダー・タブナビ・ルート定義・起動時通知/バッジ・テーマトグル配置
  index.css                デザインシステム（フォント/背景/フォーカス/入力欄の共通スタイル・ダークモード定義）
  types/index.ts           型定義（Racket, StringingRecord, PracticeSession, TensionFeel, RestringSettings ほか）
  context/
    DataContext.tsx        全データ＋認証＋同期の中枢（各hookはここを参照）
  lib/
    storage.ts             localStorage の read/write（キー定義・同期メタもここ）
    restring.ts            張り替え時期の判定ロジック（練習＋試合の使用時間で判定）
    forecast.ts            ガット寿命の予測（直近のプレーペースから次の張り替え時期を見積もる）
    navOrder.ts            ヘッダーのタブ一覧と並び順（ドラッグで並び替え・localStorageのみ）
    racket.ts              ラケットの正規化（purchaseDate/archived の補完）・使用中の絞り込み
    shoe.ts                シューズの使用時間集計・買い替え判定・サーフェス一覧（練習＋試合）・正規化/アーカイブ絞り込み
    match.ts               試合の勝敗判定・スコア整形・勝率集計
    wishlist.ts            欲しいものの優先度ラベル・並び替え
    packing.ts             合宿持ち物のカテゴリ・定番プリセット
    settings.ts            ガット種類別の基準／シューズ基準の既定値・正規化
    stats.ts               統計の集計（月別練習・ガット別使用傾向/平均★/コスト・costStats）
    backup.ts              エクスポート/インポート（バックアップ・復元）
    date.ts                ローカルTZの日付ユーティリティ（todayISO / addDaysISO 等）
    cost.ts                費用の合算・¥表示（recordCost, formatYen）
    tensionFeel.ts         テンション体感の選択肢・ラベル・色
    notify.ts              ブラウザ通知・アプリアイコンバッジ
    firebase.ts            Firebase 初期化・設定（apiKey もここ）
    cloud.ts               Firestore 入出力（users/{uid} の read/write/購読）
    theme.ts               表示テーマ（ライト/ダーク）の解決・保存・適用
    matchmaker.ts          対戦表の自動生成（ダブルス/シングルス・ラウンド生成/追加）＋保存データ SavedSchedule の検証
  hooks/
    useRackets.ts          ラケットのCRUD（DataContext のthin wrapper）
    useShoes.ts            シューズのCRUD
    useMatches.ts          試合記録のCRUD
    useWishlist.ts         欲しいものリストのCRUD
    usePacking.ts          持ち物リストのCRUD（一括追加・チェック一括リセット含む）
    useStringingRecords.ts 張り替え記録のCRUD
    usePracticeSessions.ts 練習記録のCRUD
    useSettings.ts         張り替え基準の設定の読み書き
    useRestringSummary.ts  全ラケットの overdue/warning 集計（通知・バッジ用）
  components/
    AuthBar.tsx            ヘッダーのログイン/同期状態UI
    ThemeToggle.tsx        ヘッダーのライト/ダーク切替ボタン
    NavTabs.tsx            ヘッダーのタブ（通常表示＋ドラッグ並び替えモード）
    StarRating.tsx         ★評価の入力/表示
    HistoryFilter.tsx      履歴の絞り込みバー（共通）
  pages/
    DashboardPage.tsx      張り替え時期の状況一覧・要張り替えサマリー・通知オン
    RacketsPage.tsx        ラケット管理（詳細/タイムラインへのリンク）
    RacketDetailPage.tsx   ラケット詳細（テンション推移・タイムライン）。ルート /racket/:id
    ShoesPage.tsx          シューズ管理（登録・使用時間・買い替え判定）。ルート /shoes
    MatchesPage.tsx        試合記録（シングルス/ダブルス・ゲームスコア・勝敗自動・勝率）。ルート /matches
    WishlistPage.tsx       欲しいものリスト（優先度・価格・購入チェック）。ルート /wishlist
    PackingPage.tsx        合宿持ち物リスト（定番プリセット・カテゴリ・チェック一括リセット）。ルート /packing
    StringingPage.tsx      ガット張り替え記録（追加・編集・削除・絞り込み・ガット名/張り場所のサジェスト）
    PracticePage.tsx       練習記録（追加・編集・削除・体感・絞り込み）
    StatsPage.tsx          統計（今月サマリー・月別棒グラフ・コスト・ガット別・ガット比較）
    DataPage.tsx           バックアップ/復元・CSVエクスポート
    SettingsPage.tsx       ガット種類別の張り替え基準の設定
    MatchmakerPage.tsx     対戦表（参加者・コート数・ラウンド数から自動生成）。ルート /matchmaker
    ManualPage.tsx         使い方マニュアル（ルート /manual。ヘッダー右上「使い方」ボタンから）
firestore.rules            Firestore セキュリティルール（本人のみ読み書き可）
public/
  favicon.svg / app-icon.svg          テニスボール風アイコン（SVG）
  pwa-192x192.png / pwa-512x512.png   PWAアイコン
  apple-touch-icon.png                iOSホーム画面用
```

---

## 5. データモデル（`src/types/index.ts`）

```ts
Racket           { id, name, purchaseDate, archived, createdAt }  // purchaseDate=購入日（未入力は ''）、archived=アーカイブ。createdAt はアプリへの登録日時で購入日とは別
Shoe             { id, name, purchaseDate, price, surface, archived, notes, createdAt }  // 任意項目の未入力は ''／0（Firestoreはundefinedを保存できない）
StringingRecord  { id, racketId, date, gutName, gutType, mainTension, crossTension, shop, gutPrice?, stringingFee?, rating?, notes }  // rating=打感★1〜5、gutPrice/stringingFee=費用（円）。いずれも任意
PracticeSession  { id, racketId, shoeId?, date, durationMinutes, tensionFeel?, notes }  // shoeId=履いたシューズ（未選択は ''）、tensionFeel='tight'|'ok'|'loose'（任意）
MatchRecord      { id, racketId, shoeId?, date, format, opponent, partner?, sets, durationMinutes, notes }  // format='singles'|'doubles'、sets=MatchSet[]（勝敗は自動判定）、durationMinutes=使用時間へ加算
MatchSet         { myGames, opponentGames }  // 0-0 の空セットは無視
TensionFeel      'tight'（かたい/張りたて） | 'ok'（ちょうど） | 'loose'（ゆるい/へたり）
GutType          'ポリエステル' | 'ナイロン（合成繊維）' | 'ナチュラル' | 'ハイブリッド'
ShoeSurface      'オールコート' | 'オムニ・クレー' | 'ハード' | 'クレー' | 'カーペット'
MatchFormat      'singles' | 'doubles'
WishItem         { id, name, price, priority, bought, notes, createdAt }  // priority='high'|'mid'|'low'、price未入力は 0
WishPriority     'high'（高） | 'mid'（中） | 'low'（低）
PackingItem      { id, name, category, quantity, packed }  // category未設定は ''、quantityは1以上
RestringSettings { thresholds: Record<GutType, { hours, days }>, shoeHours }
SavedSchedule    { schedule, names, createdAt }  // 生成した対戦表。names=生成時点の名前の控え。無いときは null（lib/matchmaker.ts）
```

### localStorage キー（`src/lib/storage.ts`）
- `tennis-tracker:rackets`
- `tennis-tracker:shoes`
- `tennis-tracker:matches`
- `tennis-tracker:stringing-records`
- `tennis-tracker:practice-sessions`
- `tennis-tracker:wishlist`（欲しいものリスト）
- `tennis-tracker:packing`（合宿持ち物リスト）
- `tennis-tracker:settings`
- `tennis-tracker:owner`（ローカルデータの持ち主uid：同期用）
- `tennis-tracker:pending-replace`（復元直後にクラウドを置き換えるフラグ）
- `tennis-tracker:theme`（表示テーマ `light`/`dark`。未設定ならOS設定に追従）
- `tennis-tracker:nav-order`（タブの並び順。パスの配列。未設定なら既定順）
- `tennis-tracker:restring-banner-dismissed`（要張り替えサマリーバナーを閉じた時の状況署名）
- `tennis-tracker:roster`（対戦表の参加者名簿。他データと同じく端末間同期・バックアップ対象）
- `tennis-tracker:matchmaker`（生成した対戦表。クリアするまで残る。端末間同期・バックアップ対象）

未ログイン時のデータは端末・ブラウザごとに独立。**Googleログインすると端末間で同期**される（6.1参照）。ログインしない場合は「データ」タブでJSONを書き出し／読み込みして移行する。

---

## 6. 張り替え判定ロジック（`src/lib/restring.ts` / `settings.ts`）

- 判定は **使用時間** または **経過日数** の **どちらかが基準に達したら**「張り替え推奨(overdue)」。
- 基準の **80%**（`WARNING_RATIO`）に達したら「そろそろ(warning)」。
- 基準は**ガット種類ごと**に持ち、設定画面で変更可能。既定値：

| ガット種類 | 使用時間 | 経過日数 |
|---|---|---|
| ポリエステル | 20時間 | 75日（約2.5ヶ月） |
| ナイロン | 40時間 | 150日（約5ヶ月） |
| ナチュラル | 40時間 | 150日（ナイロン相当） |
| ハイブリッド | 20時間 | 75日（ポリ相当） |

- **使用時間**＝最新の張り替え日以降の練習＋試合の合計時間（`hoursPlayedSinceStringing`。試合は `getRestringInfo` の `matches` 引数で合算）。
- 統計の「ガット別使用傾向」は、各ラケットの張り替え履歴を時系列に並べ、
  「次の張り替えまで」の練習時間をそのガットの使用時間として積み上げて算出する（`lib/stats.ts`）。

設定値が壊れていたり項目が欠けていても `resolveSettings()` が既定値で補完する。

---

## 6.1 端末間同期（Firebase）

- 未ログイン時は従来通り localStorage のみで動作。**Googleログインすると `users/{uid}` の1ドキュメントに全データを保存**し、リアルタイム同期する。
- 実装: `src/lib/firebase.ts`（初期化・設定）、`src/lib/cloud.ts`（Firestore入出力）、`src/context/DataContext.tsx`（認証＋同期の中枢。各hookはここを参照するだけ）、`src/components/AuthBar.tsx`（ヘッダーのログインUI）。
- 同期方式は**whole-document（後勝ち）**。初回ログイン時のみローカルとクラウドをid結合して取りこぼしを防ぐ。1人が複数端末で使う用途を想定。
- ログイン統合ロジックは `resolveOnLogin`（DataContext）で分岐：
  - **持ち主(uid)を `tennis-tracker:owner` に記録**。別アカウントでログインしたら、前アカウントのローカルデータは引き継がず（混ざらず）クラウド側を採用する。
  - **復元時は `tennis-tracker:pending-replace` フラグ**を立て、ログイン中でも結合せずバックアップ内容でクラウドごと置き換える（データ復元＝置き換えを保証）。
- `firebaseConfig` の apiKey は秘密情報ではなく公開されても問題ない。保護は **`firestore.rules`（本人のみ読み書き可）** で担保。
- ログインは**ポップアップ方式**。モバイルPWA等でブロックされたら**リダイレクト方式に自動フォールバック**。

### Firebase側の設定（設定済み。再構築時の参照用）
1. Authentication → Sign-in method で **Google を有効化**。
2. Authentication → Settings → 承認済みドメインに **`yuichi0306.github.io`** を追加（`localhost` は既定）。
3. Firestore Database を作成（ロケーション `asia-northeast1`、Standardエディション、DB ID `(default)`）。
4. Firestore → ルール に **`firestore.rules` の内容を貼って公開**。
- プロジェクト: `tennis-gut-tracker`（Sparkプラン=無料）。Googleアカウント `porapora36@gmail.com`。

---

## 6.2 張り替え時期の通知

- サーバー不要の「開いた時に知らせる」方式（無料構成のため。バックグラウンドpushは未対応）。
- `src/lib/notify.ts`（ブラウザ通知・`navigator.setAppBadge`）、`src/hooks/useRestringSummary.ts`（全ラケットの overdue/warning 集計）。
- ダッシュボードに要張り替えサマリーと「通知をオンにする」ボタン、ナビの「ダッシュボード」タブに推奨本数バッジ、`App.tsx` で起動時に一度だけ通知＋PWAアイコンにバッジ。

---

## 6.3 打感の★評価

- 張り替え記録に **★1〜5の打感評価**（`rating`）を任意で記録。`src/components/StarRating.tsx`（入力/表示兼用）。
- 記録フォーム・履歴・ラケット詳細タイムラインに星を表示。統計「ガット別使用傾向」に **ガット別の平均★**（`gutUsage.avgRating`）。

---

## 6.4 記録の絞り込み

- 張り替え履歴・練習履歴を **ラケット別・期間（開始/終了）・キーワード**（張り替えはガット種類も）で絞り込める。
- 共通UI: `src/components/HistoryFilter.tsx`。フィルタ状態は各ページのローカルstate、絞り込みは表示時に`filter`で適用（データ本体は変更しない）。

---

## 6.5 コスト管理

- 張り替え記録に **ガット代・張り代（円）** を入力でき、統計に **累計コスト・1回あたり・1時間あたり（練習時間換算）・ガット別コスト** を表示。
- `src/lib/cost.ts`（`recordCost`＝ガット代＋張り代、`formatYen`）、集計は `src/lib/stats.ts` の `gutUsage`（cost追加）と `costStats`。

---

## 6.6 ラケット別タイムライン／テンション推移

- ラケット詳細ページ `src/pages/RacketDetailPage.tsx`（ルート `/racket/:id`）。ダッシュボードのラケット名・ラケット一覧の「タイムライン」から遷移。
- **テンション推移**：張り替えごとのメイン/クロステンションを自前SVGの折れ線で表示。
- **タイムライン**：張り替えと練習を時系列（新しい順）に一覧。各練習に「張り替え後◯時間時点」を表示（同一張り替え期間内で練習時間を累積）。
- 練習記録に **テンション体感**（`tensionFeel`）を任意で記録（`src/lib/tensionFeel.ts`）。タイムラインと練習履歴にバッジ表示。

---

## 6.7 入力候補（サジェスト）

- 張り替え記録フォームの **ガット名・張った場所** に、過去の記録からの入力候補を表示（使用回数の多い順）。
- 実装は `src/pages/StringingPage.tsx` の `suggestionsFrom()`＋ネイティブ `<datalist>`。依存追加なし・オフラインでも動作。

---

## 6.8 今月の練習サマリー／ガット比較（統計）

- **今月の練習**：今月の練習時間・回数・先月との差を統計ページ上部に表示。`src/lib/stats.ts` の `monthlySummary(sessions, todayISO())`。
- **ガット比較**：打感★・持ち（1回の張り替えあたり平均使用時間）・コスパ（¥/時間）を表で並べ、各項目のベスト値を緑で強調。`src/lib/stats.ts` の `gutComparison`（`gutUsage` に `hoursPerStringing`/`costPerHour` を追加）。

---

## 6.9 CSVエクスポート

- 「データ」タブから **張り替え記録／練習記録／試合記録をCSVで書き出し**。`src/lib/backup.ts` の `downloadStringingCsv` / `downloadPracticeCsv` / `downloadMatchCsv`。
- Excelで日本語が化けないよう **UTF-8 BOM付き**、カンマ・改行・引用符はエスケープ（`toCsv`/`csvEscape`）。

---

## 6.10 デザインシステム／ダークモード

- `src/index.css` にデザインシステムを集約：フォントスタック、キャンバス背景、見出し字間、**全フォーム/ボタン共通のフォーカスリング・入力欄の角丸**（`@layer` 外のプレーンCSSでユーティリティに優先させている）。
- カードは `rounded-xl`＋ソフトシャドウで統一。ヘッダーはスティッキーなグラデーション＋ピル型ナビ。
- **ダークモード**：`@custom-variant dark` で `<html data-theme="dark">` を基準にしたクラスベース切替。ヘッダーの `ThemeToggle`（`src/components/ThemeToggle.tsx` / `src/lib/theme.ts`）で切替、保存値がなければOS設定に追従。**`index.html` のインラインスクリプトが描画前にテーマを確定**してちらつきを防止。ヘッダーは両テーマ共通でエメラルド。
- 要張り替えサマリーバナーは **✕で閉じられる**（`tennis-tracker:restring-banner-dismissed`。本数が変わると再表示）。

---

## 6.11 対戦表（自動生成）

- 「対戦表」タブ（ルート `/matchmaker`）。集まったメンバーの**ダブルス／シングルスの対戦を自動で振り分ける**ツール。ガット/練習の記録とは独立。
- 実装：`src/lib/matchmaker.ts`（生成ロジック）／`src/pages/MatchmakerPage.tsx`（画面）。名簿は `src/lib/storage.ts` の `rosterStorage` と `DataContext` が担当（専用の `roster.ts` は同期統合時に廃止）。
- 入力：参加者（名簿から選択・その場で追加）／コート数／ラウンド数。出力：ラウンドごとの「コート・対戦・休憩」＋各自の試合数。
- アルゴリズム：ランダム再試行つきの貪欲法。**試合数を均等化**（試合数が多い人を優先して休憩）し、**同じ相手とのペア・対戦の重複を最小化**（`WEIGHT.partner`／`opponent`）。
- **「ラウンド追加」**は過去のラウンドを固定したまま累積カウントを引き継いで次のラウンドを生成（`extendSchedule`）。「再生成」は全体を作り直し。
- 名簿（`tennis-tracker:roster`）は他データと同じく `DataContext` 経由で管理し、**端末間同期・バックアップ/復元の対象**（`CloudData.roster`／`BackupData.roster`）。`MatchmakerPage` は `useData().roster` / `setRoster` を使う。出力は現状テキストコピーのみ（印刷/CSVは今後）。
- **生成した対戦表は保存される**（`SavedSchedule` = 対戦表＋生成時の名前の控え＋作成日時）。**「クリア」を押すまで残り**、アプリを閉じても消えない。名簿と同じく端末間同期・バックアップ対象（`CloudData.matchmaker`／`BackupData.matchmaker`。未作成・クリア後は `null`）。
  - 画面のstateではなく `useData().matchmaker` / `setMatchmaker` を通す。保存値は `normalizeSavedSchedule()` で検証し、壊れていれば「対戦表なし」として扱う。
  - 開き直した直後でも「再生成」できるよう、保存内容から**形式・コート数・ラウンド数・参加者の選択を一度だけ復元**する（`restoredRef`）。
  - 「ラウンド追加」では**最初の作成日時を引き継ぐ**（作り直しではないため）。

---

## 6.12 シューズ管理

- 「シューズ」タブ（ルート `/shoes`）。シューズを登録し、**練習記録で「履いたシューズ」を選ぶと使用時間が自動で積み上がる**（二重入力なし）。
- 実装：`src/lib/shoe.ts`（`getShoeUsage`＝使用時間・回数・状態・¥/時間、`SHOE_SURFACES`）／`src/pages/ShoesPage.tsx`／`src/hooks/useShoes.ts`。
- 記録項目：シューズ名（必須）・購入日・価格・サーフェス・メモ（いずれも任意）。価格を入れると **1時間あたりのコスト** を表示。
- 判定：**使用時間のみ**で行う（練習＋試合を合算。購入日は経過日数の表示だけに使い、判定には使わない）。基準に達したら「買い替え推奨」、`WARNING_RATIO`(80%)で「そろそろ」。
  基準は `RestringSettings.shoeHours`（既定 `DEFAULT_SHOE_HOURS` = 80時間）。設定画面で変更可。
- シューズを削除しても練習記録は残り、履歴・CSVでは `(削除済みシューズ)` と表示する。編集フォームでも選択が消えないよう、その旨のオプションを出す。
- **アーカイブ**（`archived`）: 履かなくなったシューズを削除せず片付ける。使用時間・履歴はそのまま残り、買い替え判定のバッジと練習／試合の選択肢から外れる。画面は「使用中」「アーカイブ済み」の2セクション。
  絞り込みは `activeShoes()`、選択肢に残す表示は `pastShoeLabel()`（どちらも `lib/shoe.ts`）。
- 同期・バックアップ対象（`CloudData.shoes`／`BackupData.shoes`）。**シューズ対応前のバックアップ（`shoes` なし）も復元できる**。`archived` の無い古いデータは `normalizeShoe()` が `false` で補完する。
- 注意：`Shoe` の任意項目は `undefined` にせず `''`／`0` を入れる。Firestore は `undefined` を保存できず `setDoc` が失敗するため。

---

## 6.13 試合記録

- 「試合」タブ（ルート `/matches`）。**シングルス／ダブルス**の試合を記録する。
- 実装：`src/lib/match.ts`（`matchResult`＝勝敗自動判定／`summarize`＝勝率集計／`formatScore` ほか）／`src/pages/MatchesPage.tsx`／`src/hooks/useMatches.ts`。
- 記録項目：日付・形式・対戦相手（必須／自由入力＋過去入力のサジェスト）・味方（ダブルスのみ）・**セットごとのゲームスコア**（最大5セット・0-0の空セットは無視）・使ったラケット（必須）・シューズ（任意）・試合時間・メモ。
- **勝敗は自動判定**：取得セット数→同数ならゲーム総数→それも同数なら「引き分け」。入力中もライブでプレビュー表示。
- **使用時間の加算**：試合時間はラケットの張り替え判定（`getRestringInfo`）とシューズの買い替え判定（`getShoeUsage`）の使用時間に**練習と合算**される。ラケット詳細のタイムライン（🏆）にも試合が並び、累計時間に含まれる。
- 履歴に勝敗・スコア・勝率のサマリー（絞り込み後の集計）。CSV書き出し（`downloadMatchCsv`）・同期・バックアップ対象（`CloudData.matches`／`BackupData.matches`）。試合対応前のバックアップ（`matches` なし）も復元可。
- 統計ページ（`StatsPage`）は現状ガット中心で、試合の勝率は「試合」タブ側に表示（統計への統合は今後）。
- 「対戦表」タブ（`/matchmaker`）とは別物。あちらは当日の組み合わせ自動生成、こちらは試合結果の記録。

---

## 6.14 欲しいものリスト・合宿持ち物リスト

- ガット・練習の記録とは独立した2つのチェックリスト機能。どちらも端末間同期・バックアップ対象（`CloudData` / `BackupData` の `wishlist` / `packing`）。対応前のバックアップ（項目なし）も復元可。
- **欲しいもの**（`/wishlist`）：`src/pages/WishlistPage.tsx` / `src/hooks/useWishlist.ts` / `src/lib/wishlist.ts`。品名（必須）・価格の目安・優先度（高/中/低）・メモ。優先度順に並び、目安合計を表示。購入チェックで「購入済み」セクションへ分離（合計からも除外）。
- **持ち物**（`/packing`）：`src/pages/PackingPage.tsx` / `src/hooks/usePacking.ts` / `src/lib/packing.ts`。定番プリセット（`PACKING_PRESET`）から一括追加でき、`addMany` は「カテゴリ+名前」が既存のものは追加しない（重複防止）。カテゴリごとに表示、個数あり、チェックで準備管理。**「チェックを一括リセット」（`resetChecks`）で次の合宿に使い回し**、「すべて削除」（`clearAll`）も可。
- チェックリストなのでCSVは無し（バックアップJSONには含まれる）。

---

## 6.15 ガット寿命の予測

- ダッシュボードの各ラケットとラケット詳細ページに **「🔮 次の張り替え予測」**（あと約◯日／◯月◯日頃）を表示。
- 実装：`src/lib/forecast.ts`（`getRestringForecast` ＝予測、`forecastText`／`forecastReason` ＝表示用テキスト）。
- 考え方：**直近4週間のプレー時間（練習＋試合・同じラケット）を1日あたりに直し**、使用時間の基準まで何日かかるかを出す。
  経過日数の基準までの残り日数と比べ、**先に到達するほう**を予測日にする（`limitedBy`）。
- 直近4週間にプレー記録がなければ **12週間まで期間を広げ**、それでも0なら**経過日数の基準だけ**で予測する（表示にその旨を出す）。
- すでに「張り替え推奨」のラケットは予測を返さない（`null`）。ラケット詳細では代わりに現在の使用時間・経過日数を出す。
- あくまで「今のペースが続いたら」の目安。設定の基準を変えれば予測も変わる。

---

## 6.16 タブの並び替え

- ヘッダー右端の **「⇅」ボタンで並び替えモード**に入り、**タブをドラッグして順番を入れ替えられる**。「完了」で終了、「既定に戻す」で初期並びに戻る。
- 実装：`src/components/NavTabs.tsx`（UI・ドラッグ処理）／`src/lib/navOrder.ts`（`NAV_ITEMS`＝タブ定義、並び順の保存・正規化、`moveItem`）。`App.tsx` は `<NavTabs badges={{ '/': summary.overdue }} />` を置くだけ。
- 並び順は **表示テーマと同じ「この端末の好み」** として `tennis-tracker:nav-order` に保存。**端末間同期・バックアップの対象外**。
- ドラッグは **Pointer Events**（マウス・タッチ共通）。通常モードでは横スクロールを邪魔しないよう、ドラッグは並び替えモード中だけ有効にし、そのときだけ `touch-action: none` を当ててタブを折り返し表示にする。
- 入れ替え先は「ポインタが重なっているタブ」だけを見る（`indexAtPoint`）。入れ替え直後はポインタがドラッグ中のタブの上に来るので、往復してブレない。
- **キーボード（← →）でも並び替え可能**。
- タブを増やすときは `NAV_ITEMS` に足すだけでよい。`resolveNavOrder()` が保存済みの順番を正規化し、**増えたタブは末尾に追加・廃止したタブは無視**するので、古い保存値でもタブが消えたり重複したりしない。

---

## 6.17 ラケットの購入日／ラケット・シューズのアーカイブ

- **購入日**（`Racket.purchaseDate`）: ラケット画面の登録／編集フォームで入力。ラケット一覧と詳細に「購入日」「購入から◯年◯ヶ月」を表示（`elapsedLabel()` @ `lib/date.ts`）。
  **表示専用**で、張り替え判定には使わない（ラケットに買い替え判定は無い）。`createdAt`（アプリへの登録日時）とは別物なので混同しない。
- **アーカイブ**（`Racket.archived` / `Shoe.archived`）: 削除せずに「もう使わない」ものを片付ける仕組み。
  - 記録は一切消えない。**入力欄の選択肢・ダッシュボード・通知/バッジ・買い替え判定から外れるだけ**。いつでも「使用中に戻す」で復帰できる。
  - 絞り込みは `activeRackets()` / `activeShoes()`。**既存記録を編集するときは選択が消えないよう**、`pastRacketLabel()` / `pastShoeLabel()` で「◯◯（アーカイブ済み）」を選択肢に残す（削除済みなら「(削除済み…)」）。
  - **履歴の絞り込みと名前表示は全件が対象**（過去の記録の名前は出し続ける）。
  - 使用中のラケットが0本でも、**編集中はフォームを出す**（`racketOptions.length === 0 && !editingId`）。これが無いと全部アーカイブしたときに既存記録を直せなくなる。
- 古いデータには項目が無いので、読み込み時に `normalizeRacket()` / `normalizeShoe()` が `''`／`false` で補完する（`lib/storage.ts` と `lib/cloud.ts` の両方で通す）。**Firestore は `undefined` を保存できない**ため、必ず値を入れる。

---

## 7. デプロイ（GitHub Pages）

- `main` ブランチへ push すると `.github/workflows/deploy.yml` が走り、自動でビルド＆公開。
- GitHub Pages はサブパス配信（`/tennis-gut-tracker/`）のため、以下で対応：
  - `vite.config.ts`: `base = process.env.VITE_BASE ?? '/'`（CIで `VITE_BASE=/tennis-gut-tracker/` を渡す）
  - `main.tsx`: `<BrowserRouter basename={import.meta.env.BASE_URL}>`
  - SPA対策として、CIで `dist/index.html` を `dist/404.html` にコピー（URL直打ち・リロード対策）
- Pages の設定（Settings → Pages）の Source は **GitHub Actions**。

### 更新の流れ
```bash
# 変更をコミット
git add -A && git commit -m "..."
git push origin main          # → 自動でビルド・デプロイ
```

---

## 8. 既知の注意点・ハマりどころ

- **リポジトリはパブリック**。当初プライベート希望だったが公開状態で作成され、公開のまま運用で合意済み。
  ソースは公開されるが、ユーザーデータは各端末のlocalStorageにのみ保存されるため他人には見えない。
- **PWAのキャッシュ**: 開発中に古い画面が出たら Service Worker を Unregister する（3章の注意参照）。
- **ローカルの `vite preview` はSPAフォールバックをしない**ため、`/tennis-gut-tracker/xxx` 直打ちは空白になる。
  本番（GitHub Pages）は `404.html` があるので問題ない。
- **`gh` CLI** はこの環境では Homebrew未導入のため `~/.local/bin/gh` に手動インストール済み。
  PATH は `~/.zshrc` に追記済み。GitHubアカウントは `yuichi0306`。

---

## 9. 今後の拡張候補

- バックグラウンドのプッシュ通知（開いていなくても届く。要 FCM＋Cloud Functions ＝ 有料枠）
- ネイティブアプリ化（Capacitor等でApp Store / Google Play配信）
- 最適テンション分析（テンション体感×実テンション値の相関）
- 月間/年間のまとめレポート
- シューズの買い替えをダッシュボード／通知／バッジにも出す（現状は「シューズ」タブ内の表示のみ）
- 試合の勝率・傾向を統計ページに統合（相手別・サーフェス別・月別勝率など。現状は「試合」タブ内の集計のみ）
- 複数ユーザーでの共有（コーチと共有など。現状は1ユーザー＝自分の複数端末を想定）

> 実装済み（6章参照）: 端末間同期 / 張り替え通知 / 打感★評価 / 記録の絞り込み / コスト管理 / ラケット別タイムライン・テンション推移 / 入力候補（サジェスト） / 今月サマリー・ガット比較 / CSVエクスポート / デザインシステム・ダークモード / 使い方マニュアル / 対戦表の自動生成 / シューズ管理 / 試合記録 / 欲しいものリスト / 合宿持ち物リスト / ガット寿命の予測 / タブの並び替え / ラケットの購入日 / ラケット・シューズのアーカイブ / 対戦表の保存
