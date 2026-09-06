import type { PracticeSession, Shoe, ShoeSurface, MatchRecord } from '../types';
import { WARNING_RATIO, DEFAULT_SHOE_HOURS } from './settings';

// 選べる対応コート（サーフェス）
export const SHOE_SURFACES: ShoeSurface[] = ['オールコート', 'オムニ・クレー', 'ハード', 'クレー', 'カーペット'];

export type ShoeStatus = 'ok' | 'warning' | 'overdue';

// アーカイブ(archived)を足す前に保存されたシューズには、この項目が無い。
// 読み込み時に false で補完する（Firestore は undefined を保存できない）。
export function normalizeShoe(s: Shoe): Shoe {
  return { ...s, archived: s.archived === true };
}

// 使用中のシューズ（アーカイブしていないもの）だけを返す。記録の入力欄で使う。
export function activeShoes(shoes: Shoe[]): Shoe[] {
  return shoes.filter((s) => !s.archived);
}

// 入力欄の選択肢に出す予備のラベル。
// アーカイブ済み・削除済みのシューズを選んでいた記録を編集したとき、選択が消えないようにする。
export function pastShoeLabel(shoes: Shoe[], id: string): string {
  const shoe = shoes.find((s) => s.id === id);
  return shoe ? `${shoe.name}（アーカイブ済み）` : '(削除済みシューズ)';
}

export interface ShoeUsage {
  hoursPlayed: number; // このシューズで練習・試合した合計時間
  sessionCount: number; // 履いた回数（練習＋試合）
  status: ShoeStatus;
  costPerHour: number | null; // 1時間あたりの価格（価格・使用時間があるときのみ）
}

// シューズの使用状況を集計する。練習と試合の両方で履いた時間を合算する。
// 使用時間が基準に達したら「買い替え推奨(overdue)」、基準の80%で「そろそろ(warning)」。
export function getShoeUsage(
  shoe: Pick<Shoe, 'id' | 'price'>,
  practiceSessions: PracticeSession[],
  shoeHours: number,
  matches: MatchRecord[] = [],
): ShoeUsage {
  let minutes = 0;
  let sessionCount = 0;
  for (const s of practiceSessions) {
    if (!s.shoeId || s.shoeId !== shoe.id) continue;
    minutes += s.durationMinutes;
    sessionCount += 1;
  }
  for (const m of matches) {
    if (!m.shoeId || m.shoeId !== shoe.id) continue;
    minutes += m.durationMinutes;
    sessionCount += 1;
  }
  const hoursPlayed = minutes / 60;

  // 基準が壊れていても落ちないよう、正の数でなければ既定値を使う
  const limit = Number.isFinite(shoeHours) && shoeHours > 0 ? shoeHours : DEFAULT_SHOE_HOURS;
  let status: ShoeStatus = 'ok';
  if (hoursPlayed >= limit) status = 'overdue';
  else if (hoursPlayed >= limit * WARNING_RATIO) status = 'warning';

  const costPerHour = shoe.price > 0 && hoursPlayed > 0 ? shoe.price / hoursPlayed : null;

  return { hoursPlayed, sessionCount, status, costPerHour };
}
