import { v4 as uuidv4 } from 'uuid';
import type { PracticeSession } from '../types';
import { useData } from '../context/DataContext';

export function usePracticeSessions() {
  const { practiceSessions: sessions, setPracticeSessions } = useData();

  function addSession(session: Omit<PracticeSession, 'id'>) {
    const newSession: PracticeSession = { ...session, id: uuidv4() };
    setPracticeSessions((prev) => [...prev, newSession]);
    return newSession;
  }

  function updateSession(id: string, session: Omit<PracticeSession, 'id'>) {
    setPracticeSessions((prev) => prev.map((s) => (s.id === id ? { ...session, id } : s)));
  }

  function deleteSession(id: string) {
    setPracticeSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return { sessions, addSession, updateSession, deleteSession };
}
