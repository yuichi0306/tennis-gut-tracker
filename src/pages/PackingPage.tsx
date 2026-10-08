import { useEffect, useRef, useState } from 'react';
import { usePacking } from '../hooks/usePacking';
import type { PackingItem } from '../types';
import { PACKING_CATEGORIES, PACKING_PRESETS } from '../lib/packing';

// 最後に開いていたリスト。表示テーマと同じ「この端末の好み」なので同期・バックアップはしない。
const SELECTED_KEY = 'tennis-tracker:packing-selected';

// カテゴリの表示順（プリセットのカテゴリ→それ以外は後ろ）
function categoryOrder(cat: string): number {
  const i = (PACKING_CATEGORIES as readonly string[]).indexOf(cat);
  return i === -1 ? PACKING_CATEGORIES.length : i;
}

export default function PackingPage() {
  const {
    lists, addList, duplicateList, renameList, deleteList,
    itemsOf, addItem, addMany, updateItem, deleteItem, resetChecks, clearItems,
  } = usePacking();

  const [selectedId, setSelectedId] = useState<string>(() => localStorage.getItem(SELECTED_KEY) ?? '');
  // 「リストを作る」メニュー。開きっぱなしだと下のボタンに重なるので、操作したら閉じる。
  const menuRef = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => { if (menuRef.current) menuRef.current.open = false; };
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(PACKING_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('1');

  // 選んでいたリストが無くなったら（削除・別端末の変更）、先頭のリストに寄せる
  const selected = lists.find((l) => l.id === selectedId) ?? lists[0] ?? null;
  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);
  useEffect(() => {
    if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
  }, [selectedId]);

  function createFromPreset(presetKey: string) {
    const preset = PACKING_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    // 同じ名前のリストがあるときは「試合2」のように連番を付ける
    const used = new Set(lists.map((l) => l.name));
    let listName = preset.name;
    for (let n = 2; used.has(listName); n += 1) listName = `${preset.name}${n}`;
    setSelectedId(addList(listName, preset.items).id);
    closeMenu();
  }

  function createEmpty() {
    const listName = prompt('リストの名前を入力してください', '新しいリスト')?.trim();
    closeMenu();
    if (!listName) return;
    setSelectedId(addList(listName).id);
  }

  function handleRename() {
    if (!selected) return;
    const next = prompt('リストの名前', selected.name)?.trim();
    if (!next || next === selected.name) return;
    renameList(selected.id, next);
  }

  function handleDuplicate() {
    if (!selected) return;
    const next = prompt('複製したリストの名前', `${selected.name}のコピー`)?.trim();
    closeMenu();
    if (!next) return;
    setSelectedId(duplicateList(selected.id, next).id);
  }

  function handleDeleteList() {
    if (!selected) return;
    const count = itemsOf(selected.id).length;
    if (!confirm(`リスト「${selected.name}」を削除しますか？\n中の持ち物${count}件も一緒に消えます。`)) return;
    deleteList(selected.id);
    setSelectedId('');
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !name.trim()) return;
    addItem(selected.id, {
      name: name.trim(),
      category: category.trim() || 'その他',
      quantity: Math.max(1, Number(quantity) || 1),
    });
    setName('');
    setQuantity('1');
  }

  const inputClass = 'rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5';

  // リストが1つも無いとき：プリセットから作ってもらう
  if (!selected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">持ち物リスト</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            合宿・試合・日帰り練習など、用途ごとにリストを作って使い分けられます。
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-4 text-gray-600 dark:text-slate-300">まだリストがありません。定番から作ると早いです。</p>
          <PresetButtons onPick={createFromPreset} />
          <button onClick={createEmpty} className="mt-3 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            空のリストを作る
          </button>
        </div>
      </div>
    );
  }

  const items = itemsOf(selected.id);
  const packedCount = items.filter((p) => p.packed).length;
  const total = items.length;
  const pct = total > 0 ? (packedCount / total) * 100 : 0;

  // カテゴリごとにまとめる
  const groups = new Map<string, PackingItem[]>();
  for (const item of items) {
    const arr = groups.get(item.category) ?? [];
    arr.push(item);
    groups.set(item.category, arr);
  }
  const sortedCategories = [...groups.keys()].sort((a, b) => categoryOrder(a) - categoryOrder(b) || a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">持ち物リスト</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          用途ごとにリストを作れます。チェックを付けて準備を管理し、次のときはチェックだけリセットして使い回せます。
        </p>
      </div>

      {/* リストの切り替え */}
      <div className="flex flex-wrap items-center gap-2">
        {lists.map((list) => {
          const listItems = itemsOf(list.id);
          const done = listItems.filter((i) => i.packed).length;
          const on = list.id === selected.id;
          return (
            <button
              key={list.id}
              onClick={() => setSelectedId(list.id)}
              aria-current={on ? 'true' : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                on
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {list.name}
              <span className={`ml-2 text-xs font-normal ${on ? 'text-white/80' : 'text-gray-400 dark:text-slate-500'}`}>
                {done}/{listItems.length}
              </span>
            </button>
          );
        })}
        <details ref={menuRef} className="relative">
          <summary className="cursor-pointer list-none rounded-full border border-dashed border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            ＋ リストを作る
          </summary>
          <div className="absolute left-0 z-10 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">定番から作る</p>
            <PresetButtons onPick={createFromPreset} stacked />
            <div className="mt-3 flex flex-col gap-1 border-t border-gray-200 pt-2 text-sm dark:border-slate-700">
              <button onClick={createEmpty} className="text-left text-emerald-700 hover:underline dark:text-emerald-400">
                空のリストを作る
              </button>
              <button onClick={handleDuplicate} className="text-left text-emerald-700 hover:underline dark:text-emerald-400">
                「{selected.name}」を複製する
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* 選んでいるリストの準備状況と操作 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="font-semibold">{selected.name}：準備 {packedCount} / {total}</span>
          <span className="text-gray-500 dark:text-slate-400">{Math.round(pct)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-gray-100 dark:bg-slate-700">
          <div className="h-full rounded bg-emerald-600 transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => resetChecks(selected.id)}
            disabled={packedCount === 0}
            className="rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          >
            チェックを一括リセット
          </button>
          <button onClick={handleRename} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            名前を変える
          </button>
          <button
            onClick={() => { if (confirm(`「${selected.name}」の持ち物をすべて削除しますか？（リストは残ります）`)) clearItems(selected.id); }}
            disabled={total === 0}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            中身を空にする
          </button>
          <button
            onClick={handleDeleteList}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-slate-600 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            リストを削除
          </button>
        </div>
        {total === 0 && (
          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-slate-700">
            <p className="mb-2 text-sm text-gray-600 dark:text-slate-300">このリストは空です。定番を入れて始められます。</p>
            <div className="flex flex-wrap gap-2">
              {PACKING_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => addMany(selected.id, preset.items)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {preset.name}の定番を入れる
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-4">
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
            「{selected.name}」に追加する
          </button>
        </div>
      </form>

      {sortedCategories.map((cat) => {
        const catItems = groups.get(cat)!;
        const done = catItems.filter((i) => i.packed).length;
        return (
          <section key={cat}>
            <h3 className="mb-2 flex items-baseline gap-2 text-base font-bold">
              {cat}
              <span className="text-xs font-normal text-gray-400 dark:text-slate-500">{done}/{catItems.length}</span>
            </h3>
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-slate-700/60 dark:border-slate-700 dark:bg-slate-800">
              {catItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={item.packed}
                    onChange={() => updateItem(item.id, { packed: !item.packed })}
                    aria-label={`${item.name} を準備済みにする`}
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                  />
                  <span className={`flex-1 ${item.packed ? 'text-gray-400 line-through dark:text-slate-500' : ''}`}>{item.name}</span>
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

// 定番プリセットから新しいリストを作るボタン（空のとき／作成メニューの両方で使う）
function PresetButtons({ onPick, stacked }: { onPick: (key: string) => void; stacked?: boolean }) {
  return (
    <div className={stacked ? 'flex flex-col gap-1.5' : 'flex flex-wrap justify-center gap-2'}>
      {PACKING_PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onPick(preset.key)}
          className={`rounded-lg border border-gray-300 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 ${stacked ? '' : 'min-w-[9rem]'}`}
        >
          <span className="block font-semibold text-emerald-700 dark:text-emerald-400">{preset.name}</span>
          <span className="block text-xs text-gray-500 dark:text-slate-400">{preset.description}</span>
        </button>
      ))}
    </div>
  );
}
