// ガット寿命の予測。「直近どれくらいのペースでプレーしているか」から、
// 次に張り替え時期（推奨ライン）へ到達する日を見積もる。
//
// 判定と同じく基準は2つ（使用時間・経過日数）あるので、
// 先に到達するほうを予測日として採用する。

import type { MatchRecord, PracticeSession } from '../types';
import type { RestringInfo } from './restring';
import { addDaysISO, todayISO } from './date';

// ペースを見る期間。まず直近4週間で見て、プレー記録がなければ12週間まで広げる。
const LOOKBACK_DAYS = 28;
const LOOKBACK_DAYS_WIDE = 84;

export interface RestringForecast {
  daysLeft: number; // 推奨ラインまであと何日か（0＝今日にも到達）
  dateISO: string; // 予測日（YYYY-MM-DD）
  limitedBy: 'hours' | 'days'; // 先に到達する基準
  hoursPerWeek: number; // 予測に使ったプレーペース（0＝直近にプレー記録がない）
  basisDays: number; // ペース算出に使った期間（日）
}

// 直近のプレーペース（練習＋試合）。同じラケットの記録だけを見る。
function recentPace(
  racketId: string,
  sessions: PracticeSession[],
  matches: MatchRecord[],
  today: string,
): { hours: number; days: number } {
  for (const days of [LOOKBACK_DAYS, LOOKBACK_DAYS_WIDE]) {
    const from = addDaysISO(today, -(days - 1));
    const minutes =
      sessions
        .filter((s) => s.racketId === racketId && s.date >= from && s.date <= today)
        .reduce((sum, s) => sum + s.durationMinutes, 0) +
      matches
        .filter((m) => m.racketId === racketId && m.date >= from && m.date <= today)
        .reduce((sum, m) => sum + m.durationMinutes, 0);
    if (minutes > 0) return { hours: minutes / 60, days };
  }
  return { hours: 0, days: LOOKBACK_DAYS_WIDE };
}

// 予測を返す。張り替え記録がない・すでに張り替え推奨の場合は null（予測する意味がないため）。
export function getRestringForecast(
  info: RestringInfo,
  racketId: string,
  sessions: PracticeSession[],
  matches: MatchRecord[],
  today: string = todayISO(),
): RestringForecast | null {
  if (!info.latestStringing || !info.threshold || info.status === 'overdue') return null;

  // 経過日数の基準まで、あと何日か
  const daysLeftByDays = Math.max(info.threshold.days - (info.daysSinceStringing ?? 0), 0);

  // 使用時間の基準まで、あと何日か。ペース不明（直近にプレーなし）なら日数基準だけで見る。
  const pace = recentPace(racketId, sessions, matches, today);
  const hoursPerDay = pace.hours / pace.days;
  const hoursLeft = Math.max(info.threshold.hours - info.hoursPlayedSinceStringing, 0);
  const daysLeftByHours = hoursPerDay > 0 ? Math.ceil(hoursLeft / hoursPerDay) : Infinity;

  const daysLeft = Math.min(daysLeftByDays, daysLeftByHours);

  return {
    daysLeft,
    dateISO: addDaysISO(today, daysLeft),
    limitedBy: daysLeftByHours <= daysLeftByDays ? 'hours' : 'days',
    hoursPerWeek: hoursPerDay * 7,
    basisDays: pace.days,
  };
}

// 「あと約12日（8/22頃）」のような表示用テキスト。
export function forecastText(f: RestringForecast): string {
  const [, m, d] = f.dateISO.split('-');
  const date = `${Number(m)}/${Number(d)}頃`;
  if (f.daysLeft <= 0) return `まもなく張り替え時期（${date}）`;
  return `あと約${f.daysLeft}日（${date}）`;
}

// 何が効いて張り替え時期になるか（表示用）。
export function forecastReason(f: RestringForecast): string {
  if (f.hoursPerWeek <= 0) return '直近のプレー記録がないため経過日数のみで計算';
  const pace = `直近${Math.round(f.basisDays / 7)}週で週${f.hoursPerWeek.toFixed(1)}時間ペース`;
  return f.limitedBy === 'hours' ? `${pace} → 使用時間の基準に到達` : `${pace} / 経過日数の基準が先に到達`;
}
