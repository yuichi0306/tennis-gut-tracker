import { v4 as uuidv4 } from 'uuid';
import type { WishItem } from '../types';
import { useData } from '../context/DataContext';

export function useWishlist() {
  const { wishlist, setWishlist } = useData();

  function addWish(item: Omit<WishItem, 'id' | 'createdAt' | 'bought'>) {
    const newItem: WishItem = { ...item, id: uuidv4(), createdAt: new Date().toISOString(), bought: false };
    setWishlist((prev) => [...prev, newItem]);
    return newItem;
  }

  function updateWish(id: string, patch: Partial<Omit<WishItem, 'id' | 'createdAt'>>) {
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }

  function deleteWish(id: string) {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  }

  return { wishlist, addWish, updateWish, deleteWish };
}
