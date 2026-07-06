import { v4 as uuidv4 } from 'uuid';
import type { Racket } from '../types';
import { useData } from '../context/DataContext';

export function useRackets() {
  const { rackets, setRackets } = useData();

  function addRacket(name: string) {
    const racket: Racket = { id: uuidv4(), name, createdAt: new Date().toISOString() };
    setRackets((prev) => [...prev, racket]);
    return racket;
  }

  function updateRacket(id: string, name: string) {
    setRackets((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  }

  function deleteRacket(id: string) {
    setRackets((prev) => prev.filter((r) => r.id !== id));
  }

  return { rackets, addRacket, updateRacket, deleteRacket };
}
