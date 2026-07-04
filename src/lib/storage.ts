import type { Racket, StringingRecord, PracticeSession } from '../types';

const KEYS = {
  rackets: 'tennis-tracker:rackets',
  stringingRecords: 'tennis-tracker:stringing-records',
  practiceSessions: 'tennis-tracker:practice-sessions',
} as const;

function load<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export const racketStorage = {
  getAll: (): Racket[] => load<Racket>(KEYS.rackets),
  save: (items: Racket[]) => save(KEYS.rackets, items),
};

export const stringingStorage = {
  getAll: (): StringingRecord[] => load<StringingRecord>(KEYS.stringingRecords),
  save: (items: StringingRecord[]) => save(KEYS.stringingRecords, items),
};

export const practiceStorage = {
  getAll: (): PracticeSession[] => load<PracticeSession>(KEYS.practiceSessions),
  save: (items: PracticeSession[]) => save(KEYS.practiceSessions, items),
};
