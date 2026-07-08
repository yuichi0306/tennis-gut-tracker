import type { PracticeSession, StringingRecord } from '../types';
import { recordCost } from './cost';

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

export interface MonthlySummary {
  month: string; // YYYY-MM（対象＝今月）
  minutes: number; // 今月の練習時間（分）
  count: number; // 今月の練習回数
  prevMinutes: number; // 先月の練習時間（分・比較用）
}

// 今月の練習サマリーを集計する。todayIso はローカルTZの YYYY-MM-DD を渡す。
export function monthlySummary(sessions: PracticeSession[], todayIso: string): MonthlySummary {
  const month = todayIso.slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  const prevMonth = `${prevY}-${String(prevM).padStart(2, '0')}`;

  let minutes = 0;
  let count = 0;
  let prevMinutes = 0;
  for (const s of sessions) {
    const mo = s.date.slice(0, 7);
    if (mo === month) {
      minutes += s.durationMinutes;
      count += 1;
    } else if (mo === prevMonth) {
      prevMinutes += s.durationMinutes;
    }
  }
  return { month, minutes, count, prevMinutes };
}

export interface GutUsage {
  gutName: string;
  count: number; // 張り替え回数
  minutes: number; // そのガットで練習した合計時間（分）
  avgRating: number | null; // 打感の平均★（評価済みがなければ null）
  cost: number; // そのガットにかかった合計費用（円）
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
    cost: number;
  }
  const byGut = new Map<string, Acc>();

  const add = (gutName: string, minutes: number, rating: number | undefined, cost: number) => {
    const cur = byGut.get(gutName) ?? { gutName, count: 0, minutes: 0, ratingSum: 0, ratedCount: 0, cost: 0 };
    cur.count += 1;
    cur.minutes += minutes;
    cur.cost += cost;
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
      add(rec.gutName, minutes, rec.rating, recordCost(rec));
    });
  }

  return [...byGut.values()]
    .map(({ gutName, count, minutes, ratingSum, ratedCount, cost }) => ({
      gutName,
      count,
      minutes,
      avgRating: ratedCount > 0 ? ratingSum / ratedCount : null,
      cost,
    }))
    .sort((a, b) => b.minutes - a.minutes || b.count - a.count);
}

export interface GutComparison extends GutUsage {
  hoursPerStringing: number; // 持ち：1回の張り替えあたりの平均使用時間（時間）
  costPerHour: number | null; // コスパ：1時間あたりコスト（費用も練習時間もある時のみ）
}

// ガット比較用に、gutUsage へ「持ち」「コスパ」を加える。
export function gutComparison(
  stringingRecords: StringingRecord[],
  practiceSessions: PracticeSession[],
): GutComparison[] {
  return gutUsage(stringingRecords, practiceSessions).map((g) => ({
    ...g,
    hoursPerStringing: g.count > 0 ? g.minutes / 60 / g.count : 0,
    costPerHour: g.cost > 0 && g.minutes > 0 ? g.cost / (g.minutes / 60) : null,
  }));
}

export interface CostStats {
  totalCost: number; // 累計コスト（円）
  costedCount: number; // 費用を記録した張り替えの件数
  avgCostPerStringing: number | null; // 1回あたりの平均コスト
  costPerHour: number | null; // 1時間の練習あたりのコスト
}

// コスト集計。1時間あたりコストは「総コスト ÷ 総練習時間」。
export function costStats(
  stringingRecords: StringingRecord[],
  practiceSessions: PracticeSession[],
): CostStats {
  let totalCost = 0;
  let costedCount = 0;
  for (const r of stringingRecords) {
    const c = recordCost(r);
    totalCost += c;
    if (c > 0) costedCount += 1;
  }
  const totalMinutes = practiceSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  return {
    totalCost,
    costedCount,
    avgCostPerStringing: costedCount > 0 ? totalCost / costedCount : null,
    costPerHour: totalMinutes > 0 && totalCost > 0 ? totalCost / (totalMinutes / 60) : null,
  };
}

// 分を「◯時間◯分」形式にする
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}
