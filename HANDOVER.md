# 引き継ぎ書 — ガット使用歴トラッカー

テニスのガット（ストリング）の張り替え履歴・練習時間を記録し、張り替え時期を管理するWebアプリ。

- **公開URL**: https://yuichi0306.github.io/tennis-gut-tracker/
- **リポジトリ**: https://github.com/yuichi0306/tennis-gut-tracker （パブリック）
- **最終更新**: 2026-07-05

---

## 1. 概要

- ラケットを登録し、ガットの張り替え記録（種類・テンション・張り場所）と練習記録（時間）を残す。
- ダッシュボードで、ガット種類ごとの基準に照らして「張り替え時期」を自動判定する。
- データは**ブラウザのlocalStorage**に保存。未ログイン・オフラインでもそのまま動く。
- **Googleログインすると端末間でリアルタイム同期**（Firebase / Firestore）。スマホとPCで同じデータを見られる。
- **PWA対応**。スマホの「ホーム画面に追加」でアプリのように起動でき、オフラインでも動く。

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
  main.tsx                 エントリ。BrowserRouter に basename を設定
  App.tsx                  ヘッダー・タブナビ・ルート定義
  index.css                Tailwind 読み込み
  types/index.ts           型定義（Racket, StringingRecord, PracticeSession, RestringSettings ほか）
  lib/
    storage.ts             localStorage の read/write（キー定義もここ）
    restring.ts            張り替え時期の判定ロジック
    settings.ts            ガット種類別の基準の既定値・正規化
    stats.ts               統計用の集計（月別練習時間・ガット別使用傾向）
    backup.ts              エクスポート/インポート（バックアップ・復元）
  hooks/
    useRackets.ts          ラケットのCRUD
    useStringingRecords.ts 張り替え記録のCRUD
    usePracticeSessions.ts 練習記録のCRUD
    useSettings.ts         張り替え基準の設定の読み書き
  pages/
    DashboardPage.tsx      張り替え時期の状況一覧
    RacketsPage.tsx        ラケット管理
    StringingPage.tsx      ガット張り替え記録（追加・編集・削除）
    PracticePage.tsx       練習記録（追加・編集・削除）
    StatsPage.tsx          統計（自前SVGの棒グラフ・バー）
    DataPage.tsx           バックアップ/復元
    SettingsPage.tsx       ガット種類別の張り替え基準の設定
public/
  favicon.svg / app-icon.svg          テニスボール風アイコン（SVG）
  pwa-192x192.png / pwa-512x512.png   PWAアイコン
  apple-touch-icon.png                iOSホーム画面用
```

---

## 5. データモデル（`src/types/index.ts`）

```ts
Racket           { id, name, createdAt }
StringingRecord  { id, racketId, date, gutName, gutType, mainTension, crossTension, shop, notes }
PracticeSession  { id, racketId, date, durationMinutes, notes }
GutType          'ポリエステル' | 'ナイロン（合成繊維）' | 'ナチュラル' | 'ハイブリッド'
RestringSettings { thresholds: Record<GutType, { hours, days }> }
```

### localStorage キー（`src/lib/storage.ts`）
- `tennis-tracker:rackets`
- `tennis-tracker:stringing-records`
- `tennis-tracker:practice-sessions`
- `tennis-tracker:settings`

データは端末・ブラウザごとに独立。機種変更やブラウザ変更時は「データ」タブでJSONを書き出し／読み込みして移行する。

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

- **使用時間**＝最新の張り替え日以降の練習時間の合計（`hoursPlayedSinceStringing`）。
- 統計の「ガット別使用傾向」は、各ラケットの張り替え履歴を時系列に並べ、
  「次の張り替えまで」の練習時間をそのガットの使用時間として積み上げて算出する（`lib/stats.ts`）。

設定値が壊れていたり項目が欠けていても `resolveSettings()` が既定値で補完する。

---

## 6.5 端末間同期（Firebase）

- 未ログイン時は従来通り localStorage のみで動作。**Googleログインすると `users/{uid}` の1ドキュメントに全データを保存**し、リアルタイム同期する。
- 実装: `src/lib/firebase.ts`（初期化・設定）、`src/lib/cloud.ts`（Firestore入出力）、`src/context/DataContext.tsx`（認証＋同期の中枢。各hookはここを参照するだけ）、`src/components/AuthBar.tsx`（ヘッダーのログインUI）。
- 同期方式は**whole-document（後勝ち）**。初回ログイン時のみローカルとクラウドをid結合して取りこぼしを防ぐ。1人が複数端末で使う用途を想定。
- `firebaseConfig` の apiKey は秘密情報ではなく公開されても問題ない。保護は **`firestore.rules`（本人のみ読み書き可）** で担保。
- ログインは**ポップアップ方式**。モバイルPWA等でブロックされたら**リダイレクト方式に自動フォールバック**。

### Firebase側の設定（コンソール作業。済んでいない項目は要対応）
1. Authentication → Sign-in method で **Google を有効化**。
2. Authentication → Settings → 承認済みドメインに **`yuichi0306.github.io`** を追加（`localhost` は既定）。
3. Firestore Database を作成（ロケーション `asia-northeast1`）。
4. Firestore → ルール に **`firestore.rules` の内容を貼って公開**。
- プロジェクト: `tennis-gut-tracker`（Sparkプラン=無料）。Googleアカウント `porapora36@gmail.com`。

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

- 記録の検索・フィルタ（ラケット別・期間別）
- 張り替え時期が近づいたときの通知（PWAのPush通知）
- ネイティブアプリ化（Capacitor等でApp Store / Google Play配信）
- 複数端末同期（Firebase / Supabase等のクラウド保存への移行）
```
