import { v4 as uuidv4 } from 'uuid';
import type { Shoe } from '../types';
import { useData } from '../context/DataContext';

export function useShoes() {
  const { shoes, setShoes } = useData();

  function addShoe(shoe: Omit<Shoe, 'id' | 'createdAt'>) {
    const newShoe: Shoe = { ...shoe, id: uuidv4(), createdAt: new Date().toISOString() };
    setShoes((prev) => [...prev, newShoe]);
    return newShoe;
  }

  function updateShoe(id: string, shoe: Omit<Shoe, 'id' | 'createdAt'>) {
    setShoes((prev) => prev.map((s) => (s.id === id ? { ...s, ...shoe } : s)));
  }

  function deleteShoe(id: string) {
    setShoes((prev) => prev.filter((s) => s.id !== id));
  }

  return { shoes, addShoe, updateShoe, deleteShoe };
}
