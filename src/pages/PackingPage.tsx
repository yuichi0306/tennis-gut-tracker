import { useState } from 'react';
import { usePacking } from '../hooks/usePacking';
import type { PackingItem } from '../types';
import { PACKING_CATEGORIES, PACKING_PRESET } from '../lib/packing';

// カテゴリの表示順（プリセットのカテゴリ→それ以外は後ろ）
function categoryOrder(cat: string): number {
  const i = (PACKING_CATEGORIES as readonly string[]).indexOf(cat);
  return i === -1 ? PACKING_CATEGORIES.length : i;
}

export default function PackingPage() {
  const { packing, addItem, addMany, updateItem, deleteItem, resetChecks, clearAll } = usePacking();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(PACKING_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('1');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addItem({ name: name.trim(), category: category.trim() || 'その他', quantity: Math.max(1, Number(quantity) || 1) });
    setName('');
    setQuantity('1');
  }

  const packedCount = packing.filter((p) => p.packed).length;
  const total = packing.length;
  const pct = total > 0 ? (packedCount / total) * 100 : 0;

  // カテゴリごとにまとめる
  const groups = new Map<string, PackingItem[]>();
  for (const item of packing) {
    const arr = groups.get(item.category) ?? [];
    arr.push(item);
    groups.set(item.category, arr);
  }
  const sortedCategories = [...groups.keys()].sort((a, b) => categoryOrder(a) - categoryOrder(b) || a.localeCompare(b));

  const inputClass = 'rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">合宿の持ち物リスト</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          持ち物にチェックを付けて準備を管理できます。定番リストから作って、次の合宿ではチェックだけリセットして使い回せます。
        </p>
      </div>

      {packing.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6 text-center">
          <p className="mb-3 text-gray-600 dark:text-slate-300">まだ持ち物がありません。定番リストから始めると早いです。</p>
          <button
            onClick={() => addMany(PACKING_PRESET)}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            定番リストを追加する
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4">
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-semibold">準備 {packedCount} / {total}</span>
            <span className="text-gray-500 dark:text-slate-400">{Math.round(pct)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-gray-100 dark:bg-slate-700">
            <div className="h-full rounded bg-emerald-600 transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={resetChecks}
              disabled={packedCount === 0}
              className="rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              チェックを一括リセット
            </button>
            <button
              onClick={() => addMany(PACKING_PRESET)}
              className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              定番を追加
            </button>
            <button
              onClick={() => { if (confirm('持ち物リストをすべて削除しますか？')) clearAll(); }}
              className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              すべて削除
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          持ち物
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: サポーター" className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          カテゴリ
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} list="packing-categories" className={inputClass} />
          <datalist id="packing-categories">
            {PACKING_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          個数
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" className={inputClass} />
        </label>
        <div className="sm:col-span-4">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
            追加する
          </button>
        </div>
      </form>

      {sortedCategories.map((cat) => {
        const items = groups.get(cat)!;
        const done = items.filter((i) => i.packed).length;
        return (
          <section key={cat}>
            <h3 className="mb-2 flex items-baseline gap-2 text-base font-bold">
              {cat}
              <span className="text-xs font-normal text-gray-400 dark:text-slate-500">{done}/{items.length}</span>
            </h3>
            <ul className="divide-y divide-gray-100 dark:divide-slate-700/60 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={item.packed}
                    onChange={() => updateItem(item.id, { packed: !item.packed })}
                    aria-label={`${item.name} を準備済みにする`}
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                  />
                  <span className={`flex-1 ${item.packed ? 'text-gray-400 dark:text-slate-500 line-through' : ''}`}>{item.name}</span>
                  {item.quantity > 1 && <span className="shrink-0 text-xs text-gray-400 dark:text-slate-500">×{item.quantity}</span>}
                  <button onClick={() => deleteItem(item.id)} aria-label={`${item.name} を削除`} className="shrink-0 text-gray-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
