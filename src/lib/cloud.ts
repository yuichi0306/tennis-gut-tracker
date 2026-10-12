import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { resolveSettings } from './settings';
import { normalizeRacket } from './racket';
import { normalizeShoe } from './shoe';
import { normalizeSavedSchedule, type SavedSchedule } from './matchmaker';
import { migratePacking } from './packing';
import type { Racket, StringingRecord, PracticeSession, RestringSettings, RosterPlayer, Shoe, MatchRecord, WishItem, PackingItem, PackingList } from '../types';

// クラウド(Firestore)に保存する1ユーザー分のデータ。
// users/{uid} の1ドキュメントに全データをまとめて保存する。
export interface CloudData {
  rackets: Racket[];
  shoes: Shoe[];
  stringingRecords: StringingRecord[];
  practiceSessions: PracticeSession[];
  matches: MatchRecord[];
  wishlist: WishItem[];
  packing: PackingItem[];
  packingLists: PackingList[];
  settings: RestringSettings;
  roster: RosterPlayer[];
  matchmaker: SavedSchedule | null; // 生成した対戦表（未作成・クリア後は null）
  updatedAt: number; // 最終更新時刻(ms)
}

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

// 不正・欠損データが来ても落ちないよう、配列・設定を正規化する。
function normalize(raw: Partial<CloudData> | undefined): Omit<CloudData, 'updatedAt'> {
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  // 複数リスト対応より前のクラウドデータも、ここで移行してから取り込む
  const packing = migratePacking(arr<PackingList>(raw?.packingLists), arr<PackingItem>(raw?.packing));
  return {
    rackets: arr<Racket>(raw?.rackets).map(normalizeRacket),
    shoes: arr<Shoe>(raw?.shoes).map(normalizeShoe),
    stringingRecords: arr<StringingRecord>(raw?.stringingRecords),
    practiceSessions: arr<PracticeSession>(raw?.practiceSessions),
    matches: arr<MatchRecord>(raw?.matches),
    wishlist: arr<WishItem>(raw?.wishlist),
    packing: packing.items,
    packingLists: packing.lists,
    settings: resolveSettings(raw?.settings),
    roster: arr<RosterPlayer>(raw?.roster),
    matchmaker: normalizeSavedSchedule(raw?.matchmaker),
  };
}

// クラウドから現在のデータを読む。まだ無ければ null。
export async function readCloud(uid: string): Promise<Omit<CloudData, 'updatedAt'> | null> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return normalize(snap.data() as Partial<CloudData>);
}

// クラウドへ全データを上書き保存する。
export async function writeCloud(uid: string, data: Omit<CloudData, 'updatedAt'>): Promise<void> {
  await setDoc(userDoc(uid), { ...data, updatedAt: Date.now() });
}

// クラウドの変更をリアルタイム購読する。解除用の関数を返す。
export function subscribeCloud(
  uid: string,
  onData: (data: Omit<CloudData, 'updatedAt'> | null) => void,
): () => void {
  return onSnapshot(userDoc(uid), (snap) => {
    onData(snap.exists() ? normalize(snap.data() as Partial<CloudData>) : null);
  });
}
