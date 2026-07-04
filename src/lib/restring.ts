import type { PracticeSession, StringingRecord, RestringSettings } from '../types';
import { DEFAULT_SETTINGS } from './settings';

export type RestringStatus = 'no-record' | 'ok' | 'warning' | 'overdue';

export interface RestringInfo {
  latestStringing: StringingRecord | null;
  hoursPlayedSinceStringing: number;
  daysSinceStringing: number | null;
  status: RestringStatus;
}

export function getRestringInfo(
  racketId: string,
  stringingRecords: StringingRecord[],
  practiceSessions: PracticeSession[],
  settings: RestringSettings = DEFAULT_SETTINGS,
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

  // 判定は経過日数で行う（使用時間は参考表示）
  let status: RestringStatus = 'ok';
  if (daysSinceStringing >= settings.overdueDays) {
    status = 'overdue';
  } else if (daysSinceStringing >= settings.warningDays) {
    status = 'warning';
  }

  return { latestStringing, hoursPlayedSinceStringing, daysSinceStringing, status };
}
