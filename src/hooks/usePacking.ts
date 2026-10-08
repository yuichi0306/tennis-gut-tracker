import { v4 as uuidv4 } from 'uuid';
import type { PackingItem, PackingList } from '../types';
import { useData } from '../context/DataContext';
import { sortedPackingLists, type PresetItem } from '../lib/packing';

export function usePacking() {
  const { packing, setPacking, packingLists, setPackingLists } = useData();
  const lists = sortedPackingLists(packingLists);

  // ---- リスト（合宿・試合…）----

  // 新しいリストを作る。プリセットを渡すとその中身も一緒に入れる。
  function addList(name: string, presetItems: PresetItem[] = []): PackingList {
    const list: PackingList = { id: uuidv4(), name, createdAt: new Date().toISOString() };
    setPackingLists((prev) => [...prev, list]);
    if (presetItems.length > 0) {
      setPacking((prev) => [
        ...prev,
        ...presetItems.map((it): PackingItem => ({ ...it, id: uuidv4(), listId: list.id, packed: false })),
      ]);
    }
    return list;
  }

  // 既存のリストを複製する（中身もコピー。チェックは外した状態で入る）
  function duplicateList(listId: string, name: string): PackingList {
    const list: PackingList = { id: uuidv4(), name, createdAt: new Date().toISOString() };
    setPackingLists((prev) => [...prev, list]);
    setPacking((prev) => [
      ...prev,
      ...prev
        .filter((p) => p.listId === listId)
        .map((p): PackingItem => ({ ...p, id: uuidv4(), listId: list.id, packed: false })),
    ]);
    return list;
  }

  function renameList(listId: string, name: string) {
    setPackingLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name } : l)));
  }

  // リストを削除する。中の持ち物も一緒に消える。
  function deleteList(listId: string) {
    setPackingLists((prev) => prev.filter((l) => l.id !== listId));
    setPacking((prev) => prev.filter((p) => p.listId !== listId));
  }

  // ---- 持ち物（リストの中身）----

  function itemsOf(listId: string): PackingItem[] {
    return packing.filter((p) => p.listId === listId);
  }

  function addItem(listId: string, item: Omit<PackingItem, 'id' | 'listId' | 'packed'>) {
    const newItem: PackingItem = { ...item, id: uuidv4(), listId, packed: false };
    setPacking((prev) => [...prev, newItem]);
    return newItem;
  }

  // 重複判定のキー。区切り文字を挟むだけだと「カテゴリA + 名前B C」と
  // 「カテゴリA B + 名前C」が同じキーになってしまうので、JSON にして取り違えを防ぐ。
  const dupKey = (category: string, name: string) => JSON.stringify([category, name]);

  // 複数まとめて追加（プリセットから）。そのリストに既にある同名（同カテゴリ）は追加しない。
  function addMany(listId: string, items: PresetItem[]) {
    setPacking((prev) => {
      const exists = new Set(prev.filter((p) => p.listId === listId).map((p) => dupKey(p.category, p.name)));
      const toAdd = items
        .filter((it) => !exists.has(dupKey(it.category, it.name)))
        .map((it): PackingItem => ({ ...it, id: uuidv4(), listId, packed: false }));
      return [...prev, ...toAdd];
    });
  }

  function updateItem(id: string, patch: Partial<Omit<PackingItem, 'id' | 'listId'>>) {
    setPacking((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function deleteItem(id: string) {
    setPacking((prev) => prev.filter((p) => p.id !== id));
  }

  // そのリストのチェックをすべて外す（次の合宿・試合で使い回す）
  function resetChecks(listId: string) {
    setPacking((prev) => prev.map((p) => (p.listId === listId && p.packed ? { ...p, packed: false } : p)));
  }

  // そのリストの持ち物を全部消す（リストの枠は残す）
  function clearItems(listId: string) {
    setPacking((prev) => prev.filter((p) => p.listId !== listId));
  }

  return {
    lists,
    addList,
    duplicateList,
    renameList,
    deleteList,
    itemsOf,
    addItem,
    addMany,
    updateItem,
    deleteItem,
    resetChecks,
    clearItems,
  };
}
