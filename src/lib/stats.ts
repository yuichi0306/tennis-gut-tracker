import type { PracticeSession, StringingRecord } from '../types';

export interface MonthlyPractice {
  month: string; // YYYY-MM
  minutes: number;
}

// 月別の練習時間を集計する。記録がある最古の月から最新月まで、空の月も0で埋める。
export function practiceByMonth(sessions: PracticeSession[]): MonthlyPractice[] {
  if (sessions.length === 0) return [];

  const byMonth = new Map<string, number>();
  for (const s of sessions) {
    const month = s.date.slice(0, 7); // YYYY-MM
    byMonth.set(month, (byMonth.get(month) ?? 0) + s.durationMinutes);
  }

  const months = [...byMonth.keys()].sort();
  const first = months[0];
  const last = months[months.length - 1];

  // first〜last の連続した月リストを作る
  const result: MonthlyPractice[] = [];
  const [fy, fm] = first.split('-').map(Number);
  const [ly, lm] = last.split('-').map(Number);
  let y = fy;
  let m = fm;
  while (y < ly || (y === ly && m <= lm)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    result.push({ month: key, minutes: byMonth.get(key) ?? 0 });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}

export interface GutUsage {
  gutName: string;
  count: number; // 張り替え回数
  minutes: number; // そのガットで練習した合計時間（分）
  avgRating: number | null; // 打感の平均★（評価済みがなければ null）
}

// ガット別の使用傾向を集計する。
// 各ラケットの張り替え記録を時系列に並べ、次の張り替えまでの期間の練習時間を
// そのガットの使用時間として積み上げる。打感の平均★も算出する。
export function gutUsage(
  stringingRecords: StringingRecord[],
  practiceSessions: PracticeSession[],
): GutUsage[] {
  interface Acc {
    gutName: string;
    count: number;
    minutes: number;
    ratingSum: number;
    ratedCount: number;
  }
  const byGut = new Map<string, Acc>();

  const add = (gutName: string, minutes: number, rating: number | undefined) => {
    const cur = byGut.get(gutName) ?? { gutName, count: 0, minutes: 0, ratingSum: 0, ratedCount: 0 };
    cur.count += 1;
    cur.minutes += minutes;
    if (typeof rating === 'number' && rating > 0) {
      cur.ratingSum += rating;
      cur.ratedCount += 1;
    }
    byGut.set(gutName, cur);
  };

  // ラケットごとに張り替え記録を昇順で処理
  const racketIds = [...new Set(stringingRecords.map((r) => r.racketId))];
  for (const racketId of racketIds) {
    const records = stringingRecords
      .filter((r) => r.racketId === racketId)
      .sort((a, b) => a.date.localeCompare(b.date));
    const practices = practiceSessions.filter((s) => s.racketId === racketId);

    records.forEach((rec, i) => {
      const start = rec.date;
      const end = records[i + 1]?.date; // 次の張り替え日（未定なら以降すべて）
      const minutes = practices
        .filter((s) => s.date >= start && (end === undefined || s.date < end))
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      add(rec.gutName, minutes, rec.rating);
    });
  }

  return [...byGut.values()]
    .map(({ gutName, count, minutes, ratingSum, ratedCount }) => ({
      gutName,
      count,
      minutes,
      avgRating: ratedCount > 0 ? ratingSum / ratedCount : null,
    }))
    .sort((a, b) => b.minutes - a.minutes || b.count - a.count);
}

// 分を「◯時間◯分」形式にする
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}
