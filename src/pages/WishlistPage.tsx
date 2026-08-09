import { useState } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import type { WishItem, WishPriority } from '../types';
import { WISH_PRIORITIES, priorityLabel, priorityClass, sortWishes } from '../lib/wishlist';
import { formatYen } from '../lib/cost';

export default function WishlistPage() {
  const { wishlist, addWish, updateWish, deleteWish } = useWishlist();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState<WishPriority>('mid');
  const [notes, setNotes] = useState('');

  function resetForm() {
    setEditingId(null);
    setName('');
    setPrice('');
    setPriority('mid');
    setNotes('');
  }

  function startEdit(w: WishItem) {
    setEditingId(w.id);
    setName(w.name);
    setPrice(w.price ? String(w.price) : '');
    setPriority(w.priority);
    setNotes(w.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = { name: name.trim(), price: Number(price) || 0, priority, notes: notes.trim() };
    if (editingId) {
      updateWish(editingId, payload);
    } else {
      addWish(payload);
    }
    resetForm();
  }

  const active = sortWishes(wishlist.filter((w) => !w.bought));
  const bought = wishlist.filter((w) => w.bought).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const remainingTotal = active.reduce((sum, w) => sum + w.price, 0);

  const inputClass = 'rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{editingId ? '欲しいものを編集' : '欲しいものリスト'}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          ほしいテニスグッズを溜めておけます。優先度の高い順に並び、買ったらチェックできます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          品名
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: バボラ ピュアアエロ" className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          価格の目安（円・任意）
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="例: 30000" min="0" step="1" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          優先度
          <select value={priority} onChange={(e) => setPriority(e.target.value as WishPriority)} className={inputClass}>
            {WISH_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          メモ（任意）
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="色・サイズ・お店など" className={inputClass} />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
            {editingId ? '更新する' : '追加する'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              キャンセル
            </button>
          )}
        </div>
      </form>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">ほしいもの（{active.length}）</h2>
          {remainingTotal > 0 && (
            <span className="text-sm text-gray-500 dark:text-slate-400">目安合計 {formatYen(remainingTotal)}</span>
          )}
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">まだ登録がありません。ほしいものを追加してみましょう。</p>
        ) : (
          <ul className="space-y-2">
            {active.map((w) => (
              <li key={w.id} className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-3 text-sm">
                <input
                  type="checkbox"
                  checked={w.bought}
                  onChange={() => updateWish(w.id, { bought: true })}
                  aria-label={`${w.name} を購入済みにする`}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${priorityClass(w.priority)}`}>{priorityLabel(w.priority)}</span>
                    <span className="font-semibold">{w.name}</span>
                    {w.price > 0 && <span className="text-gray-500 dark:text-slate-400">{formatYen(w.price)}</span>}
                  </p>
                  {w.notes && <p className="mt-0.5 text-gray-500 dark:text-slate-400">{w.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => startEdit(w)} className="text-emerald-700 dark:text-emerald-400 hover:underline">編集</button>
                  <button onClick={() => deleteWish(w.id)} className="text-red-600 dark:text-red-400 hover:underline">削除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {bought.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-bold text-gray-500 dark:text-slate-400">購入済み（{bought.length}）</h2>
          <ul className="space-y-2">
            {bought.map((w) => (
              <li key={w.id} className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 shadow-sm p-3 text-sm">
                <input
                  type="checkbox"
                  checked={w.bought}
                  onChange={() => updateWish(w.id, { bought: false })}
                  aria-label={`${w.name} を未購入に戻す`}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-slate-400 line-through">
                    <span className="font-semibold">{w.name}</span>
                    {w.price > 0 && <span>{formatYen(w.price)}</span>}
                  </p>
                </div>
                <button onClick={() => deleteWish(w.id)} className="shrink-0 text-red-600 dark:text-red-400 hover:underline">削除</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
