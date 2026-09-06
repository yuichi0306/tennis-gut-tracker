import { v4 as uuidv4 } from 'uuid';
import type { Shoe } from '../types';
import { useData } from '../context/DataContext';

// 画面のフォームから渡す項目。アーカイブはフォームではなく専用のボタンで切り替える。
export type ShoeInput = Omit<Shoe, 'id' | 'createdAt' | 'archived'>;

export function useShoes() {
  const { shoes, setShoes } = useData();

  function addShoe(shoe: ShoeInput) {
    const newShoe: Shoe = { ...shoe, id: uuidv4(), archived: false, createdAt: new Date().toISOString() };
    setShoes((prev) => [...prev, newShoe]);
    return newShoe;
  }

  function updateShoe(id: string, shoe: ShoeInput) {
    setShoes((prev) => prev.map((s) => (s.id === id ? { ...s, ...shoe } : s)));
  }

  // アーカイブ／使用中に戻す。記録は消さず、入力欄や買い替え判定から外れるだけ。
  function setShoeArchived(id: string, archived: boolean) {
    setShoes((prev) => prev.map((s) => (s.id === id ? { ...s, archived } : s)));
  }

  function deleteShoe(id: string) {
    setShoes((prev) => prev.filter((s) => s.id !== id));
  }

  return { shoes, addShoe, updateShoe, setShoeArchived, deleteShoe };
}
