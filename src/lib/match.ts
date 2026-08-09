import type { MatchFormat, MatchRecord, MatchSet } from '../types';

export type MatchResult = 'win' | 'loss' | 'draw';

// 0-0 の空セットは入力途中・未使用とみなして無視する。
export function isPlayedSet(s: MatchSet): boolean {
  return s.myGames > 0 || s.opponentGames > 0;
}

// スコア（セットごとのゲーム数）から勝敗を判定する。
// まず取得セット数で比べ、同数ならゲーム総数、それも同数なら引き分け。
export function matchResult(sets: MatchSet[]): MatchResult {
  let mySets = 0;
  let theirSets = 0;
  let myGames = 0;
  let theirGames = 0;
  for (const s of sets) {
    if (!isPlayedSet(s)) continue;
    myGames += s.myGames;
    theirGames += s.opponentGames;
    if (s.myGames > s.opponentGames) mySets += 1;
    else if (s.opponentGames > s.myGames) theirSets += 1;
  }
  if (mySets !== theirSets) return mySets > theirSets ? 'win' : 'loss';
  if (myGames !== theirGames) return myGames > theirGames ? 'win' : 'loss';
  return 'draw';
}

export function resultLabel(r: MatchResult): string {
  return r === 'win' ? '勝ち' : r === 'loss' ? '負け' : '引き分け';
}

export function formatLabel(f: MatchFormat): string {
  return f === 'doubles' ? 'ダブルス' : 'シングルス';
}

// スコアを「6-4, 3-6, 7-5」形式にする（空セットは除く）。
export function formatScore(sets: MatchSet[]): string {
  return sets
    .filter(isPlayedSet)
    .map((s) => `${s.myGames}-${s.opponentGames}`)
    .join(', ');
}

export interface MatchSummary {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null; // 勝率（勝÷(勝+負)）。対象がなければ null
}

// 勝敗のまとめを集計する。引き分けは勝率の分母に含めない。
export function summarize(matches: MatchRecord[]): MatchSummary {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const m of matches) {
    const r = matchResult(m.sets);
    if (r === 'win') wins += 1;
    else if (r === 'loss') losses += 1;
    else draws += 1;
  }
  const decided = wins + losses;
  return {
    total: matches.length,
    wins,
    losses,
    draws,
    winRate: decided > 0 ? wins / decided : null,
  };
}
