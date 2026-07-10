import { useState } from 'react';
import { useShoes } from '../hooks/useShoes';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import { useSettings } from '../hooks/useSettings';
import { getShoeUsage, SHOE_SURFACES, type ShoeStatus } from '../lib/shoe';
import { formatMinutes } from '../lib/stats';
import { formatYen } from '../lib/cost';
import { parseISODateLocal } from '../lib/date';
import type { Shoe, ShoeSurface } from '../types';

const statusStyles: Record<ShoeStatus, { label: string; card: string; badge: string; bar: string }> = {
  ok: {
    label: '問題なし',
    card: 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800',
    badge: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-600',
  },
  warning: {
    label: 'そろそろ買い替え時期',
    card: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30',
    badge: 'border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  overdue: {
    label: '買い替え推奨',
    card: 'border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30',
    badge: 'border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
  },
};

// 購入日からの経過日数（購入日が未入力なら null）
function daysSince(purchaseDate: string): number | null {
  if (!purchaseDate) return null;
  return Math.floor((Date.now() - parseISODateLocal(purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ShoesPage() {
  const { shoes, addShoe, updateShoe, deleteShoe } = useShoes();
  const { sessions } = usePracticeSessions();
  const { settings } = useSettings();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [surface, setSurface] = useState<ShoeSurface | ''>('');
  const [notes, setNotes] = useState('');

  function resetForm() {
    setEditingId(null);
    setName('');
    setPurchaseDate('');
    setPrice('');
    setSurface('');
    setNotes('');
  }

  function startEdit(s: Shoe) {
    setEditingId(s.id);
    setName(s.name);
    setPurchaseDate(s.purchaseDate);
    setPrice(s.price ? String(s.price) : '');
    setSurface(s.surface);
    setNotes(s.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      purchaseDate,
      price: Number(price) || 0,
      surface,
      notes: notes.trim(),
    };
    if (editingId) {
      updateShoe(editingId, payload);
    } else {
      addShoe(payload);
    }
    resetForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{editingId ? 'シューズを編集' : 'シューズを登録'}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          練習記録で履いたシューズを選ぶと、使用時間が自動で積み上がり、買い替え時期をお知らせします。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          シューズ名
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: アシックス ゲルレゾリューション 9"
            className="rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          購入日（任意）
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          価格（円・任意）
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="例: 14000" min="0" step="1" className="rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          サーフェス（任意）
          <select value={surface} onChange={(e) => setSurface(e.target.value as ShoeSurface | '')} className="rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600">
            <option value="">未選択</option>
            {SHOE_SURFACES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          メモ（任意）
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="サイズ・履き心地など" className="rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600" />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
            {editingId ? '更新する' : '登録する'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              キャンセル
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="mb-2 text-xl font-bold">登録済みシューズ</h2>
        {shoes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">まだシューズが登録されていません。</p>
        ) : (
          <ul className="space-y-3">
            {shoes.map((shoe) => {
              const usage = getShoeUsage(shoe, sessions, settings.shoeHours);
              const style = statusStyles[usage.status];
              const pct = Math.min((usage.hoursPlayed / settings.shoeHours) * 100, 100);
              const days = daysSince(shoe.purchaseDate);
              return (
                <li key={shoe.id} className={`rounded-xl border p-4 shadow-sm ${style.card}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{shoe.name}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-slate-400">
                        {shoe.surface && <span>{shoe.surface}</span>}
                        {shoe.price > 0 && <span>{formatYen(shoe.price)}</span>}
                        {days !== null && <span>購入から{days}日</span>}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-300">
                        使用時間 約{usage.hoursPlayed.toFixed(1)}時間 / 基準{settings.shoeHours}時間
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{usage.sessionCount}回</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded bg-gray-100 dark:bg-slate-700">
                      <div className={`h-full rounded ${style.bar}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                    {usage.costPerHour !== null && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        1時間あたり {formatYen(usage.costPerHour)}
                      </p>
                    )}
                  </div>

                  {shoe.notes && <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">メモ: {shoe.notes}</p>}

                  <div className="mt-3 flex gap-3 text-sm">
                    <button onClick={() => startEdit(shoe)} className="text-emerald-700 hover:underline dark:text-emerald-400">
                      編集
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`「${shoe.name}」を削除しますか？練習記録は残りますが、シューズ名は表示できなくなります。`)) {
                          if (editingId === shoe.id) resetForm();
                          deleteShoe(shoe.id);
                        }
                      }}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      削除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {shoes.length > 0 && (
          <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
            使用時間の合計は、練習記録でそのシューズを選んだ分だけ積み上がります（累計 {formatMinutes(sessions.filter((s) => s.shoeId).reduce((sum, s) => sum + s.durationMinutes, 0))}）。
          </p>
        )}
      </section>
    </div>
  );
}
