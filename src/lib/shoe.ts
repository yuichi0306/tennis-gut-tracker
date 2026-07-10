import type { PracticeSession, Shoe, ShoeSurface } from '../types';
import { WARNING_RATIO, DEFAULT_SHOE_HOURS } from './settings';

// 選べる対応コート（サーフェス）
export const SHOE_SURFACES: ShoeSurface[] = ['オールコート', 'オムニ・クレー', 'ハード', 'クレー', 'カーペット'];

export type ShoeStatus = 'ok' | 'warning' | 'overdue';

export interface ShoeUsage {
  hoursPlayed: number; // このシューズで練習した合計時間
  sessionCount: number; // 履いた回数
  status: ShoeStatus;
  costPerHour: number | null; // 1時間あたりの価格（価格・使用時間があるときのみ）
}

// シューズの使用状況を集計する。
// 使用時間が基準に達したら「買い替え推奨(overdue)」、基準の80%で「そろそろ(warning)」。
export function getShoeUsage(
  shoe: Pick<Shoe, 'id' | 'price'>,
  practiceSessions: PracticeSession[],
  shoeHours: number,
): ShoeUsage {
  let minutes = 0;
  let sessionCount = 0;
  for (const s of practiceSessions) {
    if (!s.shoeId || s.shoeId !== shoe.id) continue;
    minutes += s.durationMinutes;
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
