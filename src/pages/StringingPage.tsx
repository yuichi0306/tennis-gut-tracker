import { useState } from 'react';
import { useRackets } from '../hooks/useRackets';
import { useStringingRecords } from '../hooks/useStringingRecords';
import type { GutType } from '../types';

const gutTypes: GutType[] = ['ポリエステル', 'ナイロン（合成繊維）', 'ナチュラル', 'ハイブリッド'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function StringingPage() {
  const { rackets } = useRackets();
  const { records, addRecord, deleteRecord } = useStringingRecords();

  const [racketId, setRacketId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [gutName, setGutName] = useState('');
  const [gutType, setGutType] = useState<GutType>('ポリエステル');
  const [mainTension, setMainTension] = useState('50');
  const [crossTension, setCrossTension] = useState('50');
  const [shop, setShop] = useState('');
  const [notes, setNotes] = useState('');

  const racketName = (id: string) => rackets.find((r) => r.id === id)?.name ?? '(削除済みラケット)';

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!racketId || !gutName.trim()) return;
    addRecord({
      racketId,
      date,
      gutName: gutName.trim(),
      gutType,
      mainTension: Number(mainTension),
      crossTension: Number(crossTension),
      shop: shop.trim(),
      notes: notes.trim(),
    });
    setGutName('');
    setShop('');
    setNotes('');
  }

  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">ガット張り替えを記録</h2>
        {rackets.length === 0 ? (
          <p className="text-sm text-gray-500">先に「ラケット」タブでラケットを登録してください。</p>
        ) : (
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              ラケット
              <select value={racketId} onChange={(e) => setRacketId(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5" required>
                <option value="">選択してください</option>
                {rackets.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              張り替え日
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5" required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              ガット名
              <input type="text" value={gutName} onChange={(e) => setGutName(e.target.value)} placeholder="例: Luxilon ALU Power" className="rounded border border-gray-300 px-2 py-1.5" required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              ガットの種類
              <select value={gutType} onChange={(e) => setGutType(e.target.value as GutType)} className="rounded border border-gray-300 px-2 py-1.5">
                {gutTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              タテ糸テンション (lbs)
              <input type="number" value={mainTension} onChange={(e) => setMainTension(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5" min="0" step="0.5" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              ヨコ糸テンション (lbs)
              <input type="number" value={crossTension} onChange={(e) => setCrossTension(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5" min="0" step="0.5" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              張った場所
              <input type="text" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="例: 自分で張った / ○○テニスショップ" className="rounded border border-gray-300 px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              メモ
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded border border-gray-300 px-2 py-1.5" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                記録する
              </button>
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">張り替え履歴</h2>
        {sortedRecords.length === 0 ? (
          <p className="text-sm text-gray-500">まだ記録がありません。</p>
        ) : (
          <ul className="space-y-2">
            {sortedRecords.map((r) => (
              <li key={r.id} className="rounded border border-gray-200 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.date} - {racketName(r.racketId)}</p>
                    <p>{r.gutName}（{r.gutType}） / メイン {r.mainTension}lbs・クロス {r.crossTension}lbs</p>
                    {r.shop && <p className="text-gray-500">張り場所: {r.shop}</p>}
                    {r.notes && <p className="text-gray-500">メモ: {r.notes}</p>}
                  </div>
                  <button onClick={() => deleteRecord(r.id)} className="shrink-0 text-red-600 hover:underline">
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
