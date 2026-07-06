import { useState } from 'react';
import { useRackets } from '../hooks/useRackets';
import { useStringingRecords } from '../hooks/useStringingRecords';
import type { GutType } from '../types';
import type { StringingRecord } from '../types';
import { todayISO } from '../lib/date';
import StarRating from '../components/StarRating';

const gutTypes: GutType[] = ['ポリエステル', 'ナイロン（合成繊維）', 'ナチュラル', 'ハイブリッド'];

export default function StringingPage() {
  const { rackets } = useRackets();
  const { records, addRecord, updateRecord, deleteRecord } = useStringingRecords();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [racketId, setRacketId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [gutName, setGutName] = useState('');
  const [gutType, setGutType] = useState<GutType>('ポリエステル');
  const [mainTension, setMainTension] = useState('50');
  const [crossTension, setCrossTension] = useState('50');
  const [shop, setShop] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const racketName = (id: string) => rackets.find((r) => r.id === id)?.name ?? '(削除済みラケット)';

  function resetForm() {
    setEditingId(null);
    setRacketId('');
    setDate(todayISO());
    setGutName('');
    setGutType('ポリエステル');
    setMainTension('50');
    setCrossTension('50');
    setShop('');
    setRating(0);
    setNotes('');
  }

  function startEdit(r: StringingRecord) {
    setEditingId(r.id);
    setRacketId(r.racketId);
    setDate(r.date);
    setGutName(r.gutName);
    setGutType(r.gutType);
    setMainTension(String(r.mainTension));
    setCrossTension(String(r.crossTension));
    setShop(r.shop);
    setRating(r.rating ?? 0);
    setNotes(r.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!racketId || !gutName.trim()) return;
    const payload = {
      racketId,
      date,
      gutName: gutName.trim(),
      gutType,
      mainTension: Number(mainTension),
      crossTension: Number(crossTension),
      shop: shop.trim(),
      rating,
      notes: notes.trim(),
    };
    if (editingId) {
      updateRecord(editingId, payload);
    } else {
      addRecord(payload);
    }
    resetForm();
  }

  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">{editingId ? 'ガット張り替えを編集' : 'ガット張り替えを記録'}</h2>
        {rackets.length === 0 ? (
          <p className="text-sm text-gray-500">先に「ラケット」タブでラケットを登録してください。</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1 text-sm">
              打感（★評価）
              <div className="flex h-[38px] items-center gap-2">
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <button type="button" onClick={() => setRating(0)} className="text-xs text-gray-400 hover:underline">
                    クリア
                  </button>
                )}
              </div>
            </div>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              メモ
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded border border-gray-300 px-2 py-1.5" />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                {editingId ? '更新する' : '記録する'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  キャンセル
                </button>
              )}
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
                    {r.rating ? (
                      <p className="flex items-center gap-1 text-gray-500">
                        打感: <StarRating value={r.rating} size="sm" />
                      </p>
                    ) : null}
                    {r.shop && <p className="text-gray-500">張り場所: {r.shop}</p>}
                    {r.notes && <p className="text-gray-500">メモ: {r.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(r)} className="text-emerald-700 hover:underline">
                      編集
                    </button>
                    <button onClick={() => deleteRecord(r.id)} className="text-red-600 hover:underline">
                      削除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
