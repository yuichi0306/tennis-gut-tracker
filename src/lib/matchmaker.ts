// ダブルス／シングルスの対戦表を自動生成する。
// 目標：全員の試合数を均等に／同じ人と組む・当たる回数をできるだけ減らす。
// 小規模（〜24人程度）を想定し、ランダム再試行つきの貪欲法でブラウザ内で即時生成する。

export type MatchMode = 'doubles' | 'singles';

export interface Match {
  court: number; // 1始まり
  team1: string[]; // playerId（ダブルスは2人・シングルスは1人）
  team2: string[];
}

export interface Round {
  index: number; // 0始まり
  matches: Match[];
  resting: string[]; // このラウンドで休憩する playerId
}

export interface Schedule {
  mode: MatchMode;
  playerIds: string[];
  courts: number;
  rounds: Round[];
}

export function playersPerMatch(mode: MatchMode): number {
  return mode === 'doubles' ? 4 : 2;
}

export function minPlayers(mode: MatchMode): number {
  return playersPerMatch(mode);
}

// ---- 内部：累積カウント ----

interface Acc {
  play: Record<string, number>; // 試合数
  rest: Record<string, number>; // 休憩回数
  partner: Record<string, number>; // ペアになった回数（ダブルスのみ）
  opponent: Record<string, number>; // 対戦した回数
}

function newAcc(ids: string[]): Acc {
  const play: Record<string, number> = {};
  const rest: Record<string, number> = {};
  for (const id of ids) {
    play[id] = 0;
    rest[id] = 0;
  }
  return { play, rest, partner: {}, opponent: {} };
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function pairVal(map: Record<string, number>, a: string, b: string): number {
  return map[pairKey(a, b)] ?? 0;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// このラウンドで休憩する人を選ぶ。試合数が多い人を優先して休ませ、均等化する。
function chooseResters(acc: Acc, ids: string[], restN: number): string[] {
  if (restN <= 0) return [];
  const arr = shuffled(ids); // 同点はランダムにするため先に混ぜる
  arr.sort((a, b) => acc.play[b] - acc.play[a] || acc.rest[a] - acc.rest[b]);
  return arr.slice(0, restN);
}

// 4人を2ペアに分ける3通りから、ペア・対戦の重複が最小の分け方を選ぶ。
function bestPairingOf4(g: string[], acc: Acc): { team1: string[]; team2: string[] } {
  const [a, b, c, d] = g;
  const options = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];
  let best = options[0];
  let bestCost = Infinity;
  for (const o of options) {
    const cost =
      WEIGHT.partner * pairVal(acc.partner, o.team1[0], o.team1[1]) +
      WEIGHT.partner * pairVal(acc.partner, o.team2[0], o.team2[1]) +
      WEIGHT.opponent * crossOppCost(acc, o.team1, o.team2);
    if (cost < bestCost) {
      bestCost = cost;
      best = o;
    }
  }
  return best;
}

function crossOppCost(acc: Acc, t1: string[], t2: string[]): number {
  let c = 0;
  for (const x of t1) for (const y of t2) c += pairVal(acc.opponent, x, y);
  return c;
}

const WEIGHT = { partner: 100, opponent: 5 };
const ARRANGE_TRIES = 160; // 1ラウンドの並べ方の試行回数
const SCHEDULE_TRIES = 40; // 全体（新規生成）の再試行回数

// アクティブな選手を m コートに割り当て、コストが最小の組を返す。
function arrange(playing: string[], m: number, mode: MatchMode, acc: Acc): Match[] {
  let best: Match[] = [];
  let bestCost = Infinity;
  for (let t = 0; t < ARRANGE_TRIES; t++) {
    const order = shuffled(playing);
    const matches: Match[] = [];
    if (mode === 'doubles') {
      for (let i = 0; i < m; i++) {
        const g = order.slice(i * 4, i * 4 + 4);
        const { team1, team2 } = bestPairingOf4(g, acc);
        matches.push({ court: i + 1, team1, team2 });
      }
    } else {
      for (let i = 0; i < m; i++) {
        matches.push({ court: i + 1, team1: [order[i * 2]], team2: [order[i * 2 + 1]] });
      }
    }
    const cost = roundCost(matches, acc);
    if (cost < bestCost) {
      bestCost = cost;
      best = matches;
    }
  }
  return best;
}

function roundCost(matches: Match[], acc: Acc): number {
  let c = 0;
  for (const mt of matches) {
    if (mt.team1.length === 2) c += WEIGHT.partner * pairVal(acc.partner, mt.team1[0], mt.team1[1]);
    if (mt.team2.length === 2) c += WEIGHT.partner * pairVal(acc.partner, mt.team2[0], mt.team2[1]);
    c += WEIGHT.opponent * crossOppCost(acc, mt.team1, mt.team2);
  }
  return c;
}

// 1ラウンド分を生成し、acc を更新して返す。
function genRound(acc: Acc, ids: string[], courts: number, mode: MatchMode, index: number): Round {
  const size = playersPerMatch(mode);
  const m = Math.min(courts, Math.floor(ids.length / size));
  const seats = m * size;
  const restN = ids.length - seats;

  const resting = chooseResters(acc, ids, restN);
  const restSet = new Set(resting);
  const playing = ids.filter((id) => !restSet.has(id));

  const matches = m > 0 ? arrange(playing, m, mode, acc) : [];

  // acc を確定更新
  for (const id of resting) acc.rest[id] += 1;
  for (const mt of matches) {
    const all = [...mt.team1, ...mt.team2];
    for (const id of all) acc.play[id] += 1;
    if (mt.team1.length === 2) bump(acc.partner, mt.team1[0], mt.team1[1]);
    if (mt.team2.length === 2) bump(acc.partner, mt.team2[0], mt.team2[1]);
    for (const x of mt.team1) for (const y of mt.team2) bump(acc.opponent, x, y);
  }
  return { index, matches, resting };
}

function bump(map: Record<string, number>, a: string, b: string): void {
  const k = pairKey(a, b);
  map[k] = (map[k] ?? 0) + 1;
}

// 全体の質を測るコスト（小さいほど良い）。
function scheduleCost(acc: Acc): number {
  let c = 0;
  for (const k in acc.partner) if (acc.partner[k] > 1) c += WEIGHT.partner * (acc.partner[k] - 1) * acc.partner[k];
  for (const k in acc.opponent) if (acc.opponent[k] > 1) c += WEIGHT.opponent * (acc.opponent[k] - 1);
  const plays = Object.values(acc.play);
  if (plays.length) c += 50 * (Math.max(...plays) - Math.min(...plays));
  return c;
}

// 新規に rounds ラウンド分の対戦表を作る（複数回試して最良を採用）。
export function generateSchedule(
  playerIds: string[],
  courts: number,
  mode: MatchMode,
  rounds: number,
): Schedule {
  let best: Round[] = [];
  let bestCost = Infinity;
  for (let t = 0; t < SCHEDULE_TRIES; t++) {
    const acc = newAcc(playerIds);
    const rs: Round[] = [];
    for (let r = 0; r < rounds; r++) rs.push(genRound(acc, playerIds, courts, mode, r));
    const cost = scheduleCost(acc);
    if (cost < bestCost) {
      bestCost = cost;
      best = rs;
    }
  }
  return { mode, playerIds, courts, rounds: best };
}

// 既存の対戦表に addCount ラウンド追加する（過去ラウンドは固定し、累積を引き継ぐ）。
export function extendSchedule(schedule: Schedule, addCount: number): Schedule {
  const acc = accFromRounds(schedule);
  const start = schedule.rounds.length;
  const added: Round[] = [];
  for (let r = 0; r < addCount; r++) {
    added.push(genRound(acc, schedule.playerIds, schedule.courts, schedule.mode, start + r));
  }
  return { ...schedule, rounds: [...schedule.rounds, ...added] };
}

function accFromRounds(schedule: Schedule): Acc {
  const acc = newAcc(schedule.playerIds);
  for (const round of schedule.rounds) {
    for (const id of round.resting) if (id in acc.rest) acc.rest[id] += 1;
    for (const mt of round.matches) {
      for (const id of [...mt.team1, ...mt.team2]) if (id in acc.play) acc.play[id] += 1;
      if (mt.team1.length === 2) bump(acc.partner, mt.team1[0], mt.team1[1]);
      if (mt.team2.length === 2) bump(acc.partner, mt.team2[0], mt.team2[1]);
      for (const x of mt.team1) for (const y of mt.team2) bump(acc.opponent, x, y);
    }
  }
  return acc;
}

// 各選手の試合数（表示・公平性確認用）。
export function playCounts(schedule: Schedule): { id: string; games: number }[] {
  const map: Record<string, number> = {};
  for (const id of schedule.playerIds) map[id] = 0;
  for (const round of schedule.rounds) {
    for (const mt of round.matches) {
      for (const id of [...mt.team1, ...mt.team2]) map[id] = (map[id] ?? 0) + 1;
    }
  }
  return schedule.playerIds.map((id) => ({ id, games: map[id] ?? 0 }));
}

// 共有用のテキストに整形する。
export function formatScheduleText(schedule: Schedule, nameOf: (id: string) => string): string {
  const team = (ids: string[]) => ids.map(nameOf).join('・');
  const lines: string[] = [`テニス対戦表（${schedule.mode === 'doubles' ? 'ダブルス' : 'シングルス'}）`, ''];
  schedule.rounds.forEach((round) => {
    lines.push(`ラウンド${round.index + 1}`);
    round.matches.forEach((mt) => {
      lines.push(`  コート${mt.court}: ${team(mt.team1)} vs ${team(mt.team2)}`);
    });
    if (round.resting.length) lines.push(`  休憩: ${round.resting.map(nameOf).join('・')}`);
  });
  lines.push('', '各自の試合数');
  lines.push(playCounts(schedule).map((p) => `${nameOf(p.id)}: ${p.games}`).join(' / '));
  return lines.join('\n');
}
