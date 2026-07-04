import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Racket } from '../types';
import { racketStorage } from '../lib/storage';

export function useRackets() {
  const [rackets, setRackets] = useState<Racket[]>([]);

  useEffect(() => {
    setRackets(racketStorage.getAll());
  }, []);

  function addRacket(name: string) {
    const racket: Racket = { id: uuidv4(), name, createdAt: new Date().toISOString() };
    const next = [...rackets, racket];
    setRackets(next);
    racketStorage.save(next);
    return racket;
  }

  function updateRacket(id: string, name: string) {
    const next = rackets.map((r) => (r.id === id ? { ...r, name } : r));
    setRackets(next);
    racketStorage.save(next);
  }

  function deleteRacket(id: string) {
    const next = rackets.filter((r) => r.id !== id);
    setRackets(next);
    racketStorage.save(next);
  }

  return { rackets, addRacket, updateRacket, deleteRacket };
}
