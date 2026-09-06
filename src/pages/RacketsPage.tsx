import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRackets } from '../hooks/useRackets';
import { elapsedLabel } from '../lib/date';
import type { Racket } from '../types';

export default function RacketsPage() {
  const { rackets, addRacket, updateRacket, deleteRacket } = useRackets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');

  function resetForm() {
    setEditingId(null);
    setName('');
    setPurchaseDate('');
  }

  function startEdit(r: Racket) {
    setEditingId(r.id);
    setName(r.name);
    setPurchaseDate(r.purchaseDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = { name: name.trim(), purchaseDate };
    if (editingId) {
      updateRacket(editingId, payload);
    } else {
      addRacket(payload);
    }
    resetForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{editingId ? 'ラケットを編集' : 'ラケットを登録'}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          購入日を入れておくと、一覧とラケット詳細に「購入から◯年◯ヶ月」が出ます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          ラケット名
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: Wilson Blade 98 v8"
            className="rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          購入日（任意）
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600"
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
            {editingId ? '更新する' : '登録する'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="mb-2 text-xl font-bold">登録済みラケット</h2>
        {rackets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">まだラケットが登録されていません。</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
            {rackets.map((r) => {
              const elapsed = elapsedLabel(r.purchaseDate);
              return (
                <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      {r.purchaseDate ? (
                        <>
                          購入日 {r.purchaseDate}
                          {elapsed && <span className="ml-2">（購入から{elapsed}）</span>}
                        </>
                      ) : (
                        '購入日は未登録'
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link to={`/racket/${r.id}`} className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
                      タイムライン
                    </Link>
                    <button onClick={() => startEdit(r)} className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
                      編集
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`「${r.name}」を削除しますか？関連する記録は残りますが表示できなくなります。`)) {
                          if (editingId === r.id) resetForm();
                          deleteRacket(r.id);
                        }
                      }}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      削除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
