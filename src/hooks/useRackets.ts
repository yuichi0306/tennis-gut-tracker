import { v4 as uuidv4 } from 'uuid';
import type { Racket } from '../types';
import { useData } from '../context/DataContext';

// 画面から渡す入力項目。任意項目の未入力は ''（Firestore は undefined を保存できない）。
export interface RacketInput {
  name: string;
  purchaseDate: string;
}

export function useRackets() {
  const { rackets, setRackets } = useData();

  function addRacket(input: RacketInput) {
    const racket: Racket = {
      id: uuidv4(),
      name: input.name,
      purchaseDate: input.purchaseDate,
      createdAt: new Date().toISOString(),
    };
    setRackets((prev) => [...prev, racket]);
    return racket;
  }

  function updateRacket(id: string, input: RacketInput) {
    setRackets((prev) => prev.map((r) => (r.id === id ? { ...r, ...input } : r)));
  }

  function deleteRacket(id: string) {
    setRackets((prev) => prev.filter((r) => r.id !== id));
  }

  return { rackets, addRacket, updateRacket, deleteRacket };
}
