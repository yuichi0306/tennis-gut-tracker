import { Link } from 'react-router-dom';

// アプリの使い方マニュアル。ヘッダーの「使い方」ボタンから表示する。
export default function ManualPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← ダッシュボードへ戻る
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">使い方</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
          「テニスノート」は、ガットの張り替え履歴と練習の記録をつけ、ガットの張り替え時期を自動で知らせるアプリです。
          記録はお使いの端末に保存され、ログインしなくても、通信がつながらない状態でもご利用いただけます。
        </p>
      </div>

      <Section title="はじめの流れ">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li><b>ラケットを登録します。</b>「ラケット」タブでお持ちのラケットを追加してください。</li>
          <li><b>張り替えを記録します。</b>ガットを張り替えたら「ガット張り替え」タブで、日付・ガット名・テンションなどを記録します。</li>
          <li><b>練習を記録します。</b>練習したら「練習記録」タブで、日付と練習時間を記録します。履いたシューズも選べます。</li>
          <li><b>ダッシュボードで確認します。</b>張り替え時期が近づくと自動で知らせます。</li>
        </ol>
      </Section>

      <Section title="各画面の説明">
        <dl className="space-y-3">
          <Term name="ダッシュボード">
            ラケットごとの張り替え状況を一覧できます。基準に達すると「張り替え推奨」、その手前で「そろそろ張り替え時期」と表示されます。
            要張り替えがある場合は上部にまとめが表示され、確認後は右上の「×」で閉じられます。
          </Term>
          <Term name="ラケット">
            ラケットの登録・編集・削除ができます。名前を選ぶと、そのラケットのテンション推移とタイムラインを確認できます。
          </Term>
          <Term name="シューズ">
            テニスシューズを登録すると、練習記録で選んだ分だけ使用時間が積み上がり、買い替え時期の目安を表示します。
            購入日・価格・サーフェス・メモも任意で残せます。
          </Term>
          <Term name="ガット張り替え">
            張り替えの記録を追加・編集・削除します。ガット名・張った場所は、過去の入力から候補が表示されます。
            打感の評価（星1〜5）やガット代・張り代（費用）も任意で記録できます。履歴はラケットや期間、キーワードで絞り込めます。
          </Term>
          <Term name="練習記録">
            練習の記録を追加・編集・削除します。練習時間のほか、履いたシューズや、テンションの体感（かたい／ちょうどいい／ゆるい）も任意で残せます。
          </Term>
          <Term name="統計">
            今月の練習時間のまとめ、月別の練習時間、費用の集計、ガット別の使用傾向、ガット同士の比較（打感・持ち・コスパ）を確認できます。
          </Term>
          <Term name="対戦表">
            集まったメンバーで、ダブルスまたはシングルスの対戦を自動で振り分けます。参加者・コート数・ラウンド数を決めて生成すると、
            同じ人と組む・当たる回数がなるべく減るように、また各自の試合数が均等になるように組み、休憩も順番に回します。
            「ラウンド追加」で試合を後から足すこともでき、結果はテキストでコピーできます。参加者の名簿は保存され、ログインしていれば端末間でも共有されます。
          </Term>
          <Term name="データ">
            記録をファイルに書き出して保管（バックアップ）したり、書き出したファイルから復元したりできます。
            張り替え記録・練習記録はCSV形式でも書き出せ、表計算ソフトで開けます。
          </Term>
          <Term name="設定">
            ガットの種類ごとに、張り替えの目安となる「使用時間」と「経過日数」を変更できます。
            シューズの買い替えの目安となる使用時間も、ここで変更できます。
          </Term>
        </dl>
      </Section>

      <Section title="張り替え時期の判定について">
        <p>
          「使用時間（張り替え後の練習時間の合計）」または「経過日数（張り替えからの日数）」の
          <b>どちらか一方でも基準に達すると「張り替え推奨」</b>、基準の80%に達すると「そろそろ張り替え時期」と表示します。
          基準はガットの種類ごとに設定でき、初期値は次のとおりです。
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 pr-3 font-medium">ガットの種類</th>
                <th className="py-2 pr-3 font-medium">使用時間</th>
                <th className="py-2 font-medium">経過日数</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-2 [&_td]:pr-3">
              <tr className="border-b border-gray-100 dark:border-slate-700/60"><td>ポリエステル</td><td>20時間</td><td>75日（約2.5ヶ月）</td></tr>
              <tr className="border-b border-gray-100 dark:border-slate-700/60"><td>ナイロン（合成繊維）</td><td>40時間</td><td>150日（約5ヶ月）</td></tr>
              <tr className="border-b border-gray-100 dark:border-slate-700/60"><td>ナチュラル</td><td>40時間</td><td>150日</td></tr>
              <tr><td>ハイブリッド</td><td>20時間</td><td>75日</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          基準は「<Link to="/settings" className="text-emerald-700 underline dark:text-emerald-400">設定</Link>」でいつでも変更できます。
        </p>
      </Section>

      <Section title="シューズの買い替え時期について">
        <p>
          「シューズ」タブでシューズを登録し、練習記録で履いたシューズを選ぶと、そのシューズの使用時間が積み上がります。
          使用時間が基準（初期値は80時間）に達すると<b>「買い替え推奨」</b>、基準の80%で「そろそろ買い替え時期」と表示します。
          基準は「<Link to="/settings" className="text-emerald-700 underline dark:text-emerald-400">設定</Link>」で変更できます。
        </p>
      </Section>

      <Section title="端末間でデータを同期する">
        <p>
          画面右上の「ログインして同期」からGoogleアカウントでログインすると、記録がクラウドに保存され、
          スマートフォンとパソコンなど複数の端末で同じデータを見られます。ログインしない場合、データはその端末の中だけに保存されます。
        </p>
      </Section>

      <Section title="張り替え時期の通知">
        <p>
          ダッシュボードの「通知をオンにする」を押して許可すると、張り替え時期が来たときに、アプリを開いたタイミングでお知らせします。
          （常時バックグラウンドで届く通知ではありません。）
        </p>
      </Section>

      <Section title="表示テーマの切り替え">
        <p>
          画面右上の月・太陽のボタンで、ライト表示とダーク表示を切り替えられます。初回はお使いの端末の設定に合わせて表示します。
        </p>
      </Section>

      <Section title="データの保存とバックアップ">
        <p>
          記録はお使いのブラウザ内に保存されます。ブラウザのデータを削除したり、機種変更したりすると記録は失われます。
          大切な記録は、ログインして同期しておくか、「データ」タブから定期的にバックアップを書き出しておくことをおすすめします。
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:p-5">
      <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-slate-100">{title}</h3>
      {children}
    </section>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-gray-900 dark:text-slate-100">{name}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
