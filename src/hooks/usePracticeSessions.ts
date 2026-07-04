import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PracticeSession } from '../types';
import { practiceStorage } from '../lib/storage';

export function usePracticeSessions() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    setSessions(practiceStorage.getAll());
  }, []);

  function addSession(session: Omit<PracticeSession, 'id'>) {
    const newSession: PracticeSession = { ...session, id: uuidv4() };
    const next = [...sessions, newSession];
    setSessions(next);
    practiceStorage.save(next);
    return newSession;
  }

  function updateSession(id: string, session: Omit<PracticeSession, 'id'>) {
    const next = sessions.map((s) => (s.id === id ? { ...session, id } : s));
    setSessions(next);
    practiceStorage.save(next);
  }

  function deleteSession(id: string) {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    practiceStorage.save(next);
  }

  return { sessions, addSession, updateSession, deleteSession };
}
