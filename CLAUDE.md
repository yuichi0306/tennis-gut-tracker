# テニスノート（ガット張り替え管理アプリ）

ラケットのガット張り替え履歴と練習・試合を記録し、**張り替え時期を自動判定・予測**するWebアプリ。
シューズの買い替え判定、対戦表の自動生成、欲しいもの／合宿持ち物リストも入っている。

| | |
|---|---|
| 公開URL | https://yuichi0306.github.io/tennis-gut-tracker/ |
| GitHub | `yuichi0306/tennis-gut-tracker`（**パブリック**） |

## ⚠️ 触る前に

- **リポジトリは公開されている。** ソースに秘密情報を書かない。
  （ユーザーのデータは各端末の localStorage にしか無いので他人には見えない）
- **push すると GitHub Actions が自動でビルド・公開する。** push は指示があったときだけ

## 動かし方

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 型チェック + ビルド → dist/
npm run preview
npm run lint      # oxlint
```

技術：TypeScript + React 19 + Vite 8 + Tailwind v4 + Firebase(Auth/Firestore) + PWA。Node 20以上。

## ハマりどころ

- **開発中に古い画面が出たら Service Worker を疑う。**
  DevTools → Application → Service Workers で Unregister ＋ Cache Storage をクリアして再読み込み
- **`vite preview` は SPA フォールバックをしない**ので `/tennis-gut-tracker/xxx` の直打ちは空白になる。
  本番は `404.html` があるので問題ない
- **Firestore は `undefined` を保存できない。** 任意項目は `''` か `0` を入れる（`setDoc` が落ちる）
- `firebaseConfig` の apiKey は公開されて問題ない。保護は `firestore.rules`（本人のみ）で担保

## 詳細

機能ごとの実装（全16項目）・データモデル・判定ロジック・デプロイ手順は **`HANDOVER.md`**（約17,000字）。
必要になったときに読む。
