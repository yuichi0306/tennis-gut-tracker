import type { PracticeSession, StringingRecord } from '../types';

export type RestringStatus = 'no-record' | 'ok' | 'warning' | 'overdue';

export interface RestringInfo {
  latestStringing: StringingRecord | null;
  hoursPlayedSinceStringing: number;
  daysSinceStringing: number | null;
  status: RestringStatus;
}

// 一般的な目安: 20時間でそろそろ、30時間で張り替え推奨。日数は90日/120日を上限の目安とする。
const HOURS_WARNING = 20;
const HOURS_OVERDUE = 30;
const DAYS_WARNING = 90;
const DAYS_OVERDUE = 120;

export function getRestringInfo(
  racketId: string,
  stringingRecords: StringingRecord[],
  practiceSessions: PracticeSession[],
): RestringInfo {
  const recordsForRacket = stringingRecords
    .filter((r) => r.racketId === racketId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestStringing = recordsForRacket[0] ?? null;

  if (!latestStringing) {
    return {
      latestStringing: null,
      hoursPlayedSinceStringing: 0,
      daysSinceStringing: null,
      status: 'no-record',
    };
  }

  const minutesPlayed = practiceSessions
    .filter((s) => s.racketId === racketId && s.date >= latestStringing.date)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const hoursPlayedSinceStringing = minutesPlayed / 60;

  const daysSinceStringing = Math.floor(
    (Date.now() - new Date(latestStringing.date).getTime()) / (1000 * 60 * 60 * 24),
  );

  let status: RestringStatus = 'ok';
  if (hoursPlayedSinceStringing >= HOURS_OVERDUE || daysSinceStringing >= DAYS_OVERDUE) {
    status = 'overdue';
  } else if (hoursPlayedSinceStringing >= HOURS_WARNING || daysSinceStringing >= DAYS_WARNING) {
    status = 'warning';
  }

  return { latestStringing, hoursPlayedSinceStringing, daysSinceStringing, status };
}
