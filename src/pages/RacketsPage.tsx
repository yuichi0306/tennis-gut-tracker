import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRackets } from '../hooks/useRackets';

export default function RacketsPage() {
  const { rackets, addRacket, updateRacket, deleteRacket } = useRackets();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addRacket(name.trim());
    setName('');
  }

  function startEdit(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
  }

  function saveEdit(id: string) {
    if (!editingName.trim()) return;
    updateRacket(id, editingName.trim());
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">ラケットを登録</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: Wilson Blade 98 v8"
            className="flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
            追加
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">登録済みラケット</h2>
        {rackets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">まだラケットが登録されていません。</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            {rackets.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-3">
                {editingId === r.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="text-sm">{r.name}</span>
                )}
                <div className="flex shrink-0 gap-2">
                  {editingId === r.id ? (
                    <>
                      <button onClick={() => saveEdit(r.id)} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
                        保存
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to={`/racket/${r.id}`} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
                        タイムライン
                      </Link>
                      <button onClick={() => startEdit(r.id, r.name)} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
                        編集
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`「${r.name}」を削除しますか？関連する記録は残りますが表示できなくなります。`)) {
                            deleteRacket(r.id);
                          }
                        }}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        削除
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
