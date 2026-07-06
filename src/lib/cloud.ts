import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { resolveSettings } from './settings';
import type { Racket, StringingRecord, PracticeSession, RestringSettings } from '../types';

// クラウド(Firestore)に保存する1ユーザー分のデータ。
// users/{uid} の1ドキュメントに全データをまとめて保存する。
export interface CloudData {
  rackets: Racket[];
  stringingRecords: StringingRecord[];
  practiceSessions: PracticeSession[];
  settings: RestringSettings;
  updatedAt: number; // 最終更新時刻(ms)
}

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

// 不正・欠損データが来ても落ちないよう、配列・設定を正規化する。
function normalize(raw: Partial<CloudData> | undefined): Omit<CloudData, 'updatedAt'> {
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    rackets: arr<Racket>(raw?.rackets),
    stringingRecords: arr<StringingRecord>(raw?.stringingRecords),
    practiceSessions: arr<PracticeSession>(raw?.practiceSessions),
    settings: resolveSettings(raw?.settings),
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
