import type { Racket, StringingRecord, PracticeSession, RestringSettings } from '../types';
import { DEFAULT_SETTINGS } from './settings';

const KEYS = {
  rackets: 'tennis-tracker:rackets',
  stringingRecords: 'tennis-tracker:stringing-records',
  practiceSessions: 'tennis-tracker:practice-sessions',
  settings: 'tennis-tracker:settings',
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

export const settingsStorage = {
  get: (): RestringSettings => {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<RestringSettings>) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  save: (settings: RestringSettings) => localStorage.setItem(KEYS.settings, JSON.stringify(settings)),
};
