import type { Racket, StringingRecord, PracticeSession, RestringSettings, RosterPlayer } from '../types';
import { resolveSettings } from './settings';

const KEYS = {
  rackets: 'tennis-tracker:rackets',
  stringingRecords: 'tennis-tracker:stringing-records',
  practiceSessions: 'tennis-tracker:practice-sessions',
  settings: 'tennis-tracker:settings',
  roster: 'tennis-tracker:roster', // 対戦表の参加者名簿
  owner: 'tennis-tracker:owner', // このブラウザのローカルデータの持ち主(uid)
  pendingReplace: 'tennis-tracker:pending-replace', // 復元直後、クラウドを置き換えるフラグ
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

export const rosterStorage = {
  getAll: (): RosterPlayer[] =>
    load<RosterPlayer>(KEYS.roster).filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string'),
  save: (items: RosterPlayer[]) => save(KEYS.roster, items),
};

export const settingsStorage = {
  get: (): RestringSettings => {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return resolveSettings(null);
    try {
      return resolveSettings(JSON.parse(raw) as Partial<RestringSettings>);
    } catch {
      return resolveSettings(null);
    }
  },
  save: (settings: RestringSettings) => localStorage.setItem(KEYS.settings, JSON.stringify(settings)),
};

// 同期用のメタ情報（ローカルデータの持ち主・復元フラグ）
export const syncMeta = {
  getOwner: (): string | null => localStorage.getItem(KEYS.owner),
  setOwner: (uid: string) => localStorage.setItem(KEYS.owner, uid),
  isPendingReplace: (): boolean => localStorage.getItem(KEYS.pendingReplace) === '1',
  setPendingReplace: () => localStorage.setItem(KEYS.pendingReplace, '1'),
  clearPendingReplace: () => localStorage.removeItem(KEYS.pendingReplace),
};
