import type { PracticeSession, StringingRecord, RestringSettings, GutThreshold } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_THRESHOLDS, WARNING_RATIO } from './settings';
import { parseISODateLocal } from './date';

export type RestringStatus = 'no-record' | 'ok' | 'warning' | 'overdue';

export interface RestringInfo {
  latestStringing: StringingRecord | null;
  hoursPlayedSinceStringing: number;
  daysSinceStringing: number | null;
  status: RestringStatus;
  threshold: GutThreshold | null; // 適用したガット種類別の基準
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
      threshold: null,
    };
  }

  const minutesPlayed = practiceSessions
    .filter((s) => s.racketId === racketId && s.date >= latestStringing.date)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const hoursPlayedSinceStringing = minutesPlayed / 60;

  // 張り替え日はローカルタイムゾーンの0時として扱う（UTC解釈だと日本では9時間ズレる）
  const daysSinceStringing = Math.floor(
    (Date.now() - parseISODateLocal(latestStringing.date).getTime()) / (1000 * 60 * 60 * 24),
  );

  // 判定はガット種類ごとの基準で行う。使用時間または経過日数のどちらかが
  // 基準に達したら「推奨」、基準の80%に達したら「そろそろ」。
  // gutType が不正（インポートした壊れたデータ等）でも落ちないよう、ナイロンの既定値へフォールバック。
  const th =
    settings.thresholds[latestStringing.gutType] ??
    DEFAULT_SETTINGS.thresholds[latestStringing.gutType] ??
    DEFAULT_THRESHOLDS['ナイロン（合成繊維）'];
  let status: RestringStatus = 'ok';
  if (hoursPlayedSinceStringing >= th.hours || daysSinceStringing >= th.days) {
    status = 'overdue';
  } else if (hoursPlayedSinceStringing >= th.hours * WARNING_RATIO || daysSinceStringing >= th.days * WARNING_RATIO) {
    status = 'warning';
  }

  return { latestStringing, hoursPlayedSinceStringing, daysSinceStringing, status, threshold: th };
}
