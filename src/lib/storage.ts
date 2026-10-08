import type { Racket, StringingRecord, PracticeSession, RestringSettings, RosterPlayer, Shoe, MatchRecord, WishItem, PackingItem, PackingList } from '../types';
import { resolveSettings } from './settings';
import { normalizeRacket } from './racket';
import { normalizeShoe } from './shoe';
import { normalizeSavedSchedule, type SavedSchedule } from './matchmaker';
import { migratePacking } from './packing';

const KEYS = {
  rackets: 'tennis-tracker:rackets',
  shoes: 'tennis-tracker:shoes',
  stringingRecords: 'tennis-tracker:stringing-records',
  practiceSessions: 'tennis-tracker:practice-sessions',
  matches: 'tennis-tracker:matches',
  wishlist: 'tennis-tracker:wishlist', // 欲しいものリスト
  packing: 'tennis-tracker:packing', // 持ち物（品物。どのリストのものかは listId で持つ）
  packingLists: 'tennis-tracker:packing-lists', // 持ち物リスト（合宿・試合…）
  settings: 'tennis-tracker:settings',
  roster: 'tennis-tracker:roster', // 対戦表の参加者名簿
  matchmaker: 'tennis-tracker:matchmaker', // 生成した対戦表（クリアするまで残す）
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
  getAll: (): Racket[] => load<Racket>(KEYS.rackets).map(normalizeRacket),
  save: (items: Racket[]) => save(KEYS.rackets, items),
};

export const shoeStorage = {
  getAll: (): Shoe[] => load<Shoe>(KEYS.shoes).map(normalizeShoe),
  save: (items: Shoe[]) => save(KEYS.shoes, items),
};

export const stringingStorage = {
  getAll: (): StringingRecord[] => load<StringingRecord>(KEYS.stringingRecords),
  save: (items: StringingRecord[]) => save(KEYS.stringingRecords, items),
};

export const practiceStorage = {
  getAll: (): PracticeSession[] => load<PracticeSession>(KEYS.practiceSessions),
  save: (items: PracticeSession[]) => save(KEYS.practiceSessions, items),
};

export const matchStorage = {
  getAll: (): MatchRecord[] => load<MatchRecord>(KEYS.matches),
  save: (items: MatchRecord[]) => save(KEYS.matches, items),
};

export const wishlistStorage = {
  getAll: (): WishItem[] => load<WishItem>(KEYS.wishlist),
  save: (items: WishItem[]) => save(KEYS.wishlist, items),
};

export const packingStorage = {
  getAll: (): PackingItem[] => load<PackingItem>(KEYS.packing),
  save: (items: PackingItem[]) => save(KEYS.packing, items),
};

export const packingListStorage = {
  getAll: (): PackingList[] =>
    load<PackingList>(KEYS.packingLists).filter((l) => l && typeof l.id === 'string' && typeof l.name === 'string'),
  save: (items: PackingList[]) => save(KEYS.packingLists, items),
};

// 読み込み時に、複数リスト対応より前のデータを移行してから返す。
// 保存とは分けてあるので、移行結果は次の書き込みでそのまま保存される。
export function loadPacking(): { lists: PackingList[]; items: PackingItem[] } {
  return migratePacking(packingListStorage.getAll(), packingStorage.getAll());
}

export const rosterStorage = {
  getAll: (): RosterPlayer[] =>
    load<RosterPlayer>(KEYS.roster).filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string'),
  save: (items: RosterPlayer[]) => save(KEYS.roster, items),
};

// 生成した対戦表。1件だけ持ち、無いときは null。
export const matchmakerStorage = {
  get: (): SavedSchedule | null => {
    const raw = localStorage.getItem(KEYS.matchmaker);
    if (!raw) return null;
    try {
      return normalizeSavedSchedule(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  save: (value: SavedSchedule | null) => {
    if (value) localStorage.setItem(KEYS.matchmaker, JSON.stringify(value));
    else localStorage.removeItem(KEYS.matchmaker);
  },
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
