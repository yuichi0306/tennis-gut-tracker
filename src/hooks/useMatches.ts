import { v4 as uuidv4 } from 'uuid';
import type { MatchRecord } from '../types';
import { useData } from '../context/DataContext';

export function useMatches() {
  const { matches, setMatches } = useData();

  function addMatch(match: Omit<MatchRecord, 'id'>) {
    const newMatch: MatchRecord = { ...match, id: uuidv4() };
    setMatches((prev) => [...prev, newMatch]);
    return newMatch;
  }

  function updateMatch(id: string, match: Omit<MatchRecord, 'id'>) {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...match, id } : m)));
  }

  function deleteMatch(id: string) {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  }

  return { matches, addMatch, updateMatch, deleteMatch };
}
