import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import type { RosterPlayer } from '../types';
import {
  generateSchedule,
  extendSchedule,
  playCounts,
  formatScheduleText,
  minPlayers,
  type MatchMode,
  type Schedule,
} from '../lib/matchmaker';

export default function MatchmakerPage() {
  const { roster, setRoster } = useData();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [mode, setMode] = useState<MatchMode>('doubles');
  const [courts, setCourts] = useState('2');
  const [rounds, setRounds] = useState('4');
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  // 生成時点の名前の控え。あとで名簿から消された人も、表示済みのラウンドでは名前が出る。
  const [snapshotNames, setSnapshotNames] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    roster.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [roster]);
  const nameOf = (id: string) => nameMap.get(id) ?? snapshotNames[id] ?? '(不明)';

  const selectedIds = roster.filter((p) => selected.has(p.id)).map((p) => p.id);
  const need = minPlayers(mode);
  const canGenerate = selectedIds.length >= need && Number(courts) >= 1 && Number(rounds) >= 1;

  // 生成後に名簿から消された人は、以降のラウンドには入れない
  const remainingIds = schedule ? schedule.playerIds.filter((id) => nameMap.has(id)) : [];
  const canAddRound = schedule !== null && remainingIds.length >= minPlayers(schedule.mode);

  function addPlayer() {
    const name = newName.trim();
    if (!name) return;
    const player: RosterPlayer = { id: crypto.randomUUID(), name };
    setRoster((prev) => [...prev, player]);
    setSelected((prev) => new Set(prev).add(player.id));
    setNewName('');
  }

  function removePlayer(id: string) {
    setRoster((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(on: boolean) {
    setSelected(on ? new Set(roster.map((p) => p.id)) : new Set());
  }

  function generate() {
    if (!canGenerate) return;
    setSchedule(generateSchedule(selectedIds, Number(courts), mode, Number(rounds)));
    setSnapshotNames(Object.fromEntries(selectedIds.map((id) => [id, nameOf(id)])));
    setCopied(false);
  }

  function addRound() {
    if (!schedule || !canAddRound) return;
    setSchedule(extendSchedule({ ...schedule, playerIds: remainingIds }, 1));
    setCopied(false);
  }

  async function copy() {
    if (!schedule) return;
    try {
      await navigator.clipboard.writeText(formatScheduleText(schedule, nameOf));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">対戦表</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          参加者・コート数・ラウンド数を決めると、ダブルス／シングルスの対戦を自動で振り分けます。同じ人と組む・当たる回数がなるべく減るように、試合数も均等になるように組みます。
        </p>
      </div>

      {/* 参加者 */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold">参加者（選択 {selectedIds.length}人）</h3>
          {roster.length > 0 && (
            <div className="flex gap-2 text-xs">
              <button onClick={() => selectAll(true)} className="text-emerald-700 hover:underline dark:text-emerald-400">全選択</button>
              <button onClick={() => selectAll(false)} className="text-gray-500 hover:underline dark:text-slate-400">全解除</button>
            </div>
          )}
        </div>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlayer())}
            placeholder="名前を入力して追加"
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-slate-600"
          />
          <button
            onClick={addPlayer}
            className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            追加
          </button>
        </div>

        {roster.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">名前を追加すると、名簿としてこの端末に保存されます。</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {roster.map((p) => {
              const on = selected.has(p.id);
              return (
                <li key={p.id}>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                      on
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-gray-300 bg-white text-gray-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <button onClick={() => toggleSelect(p.id)} className="font-medium">
                      {on ? '✓ ' : ''}{p.name}
                    </button>
                    <button
                      onClick={() => removePlayer(p.id)}
                      aria-label={`${p.name} を名簿から削除`}
                      className="ml-0.5 text-gray-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 設定 */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-base font-bold">設定</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 dark:text-slate-300">形式</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-slate-600">
              {(['doubles', 'singles'] as MatchMode[]).map((mo) => (
                <button
                  key={mo}
                  onClick={() => setMode(mo)}
                  className={`px-4 py-1.5 text-sm font-medium ${
                    mode === mo
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {mo === 'doubles' ? 'ダブルス' : 'シングルス'}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 dark:text-slate-300">コート数</span>
            <input type="number" min="1" value={courts} onChange={(e) => setCourts(e.target.value)} className="w-24 rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 dark:text-slate-300">ラウンド数</span>
            <input type="number" min="1" value={rounds} onChange={(e) => setRounds(e.target.value)} className="w-24 rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600" />
          </label>
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            対戦表を生成
          </button>
        </div>
        {selectedIds.length < need && (
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
            {mode === 'doubles' ? 'ダブルスは4人以上' : 'シングルスは2人以上'}を選ぶと生成できます。
          </p>
        )}
      </section>

      {/* 結果 */}
      {schedule && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-auto text-base font-bold">
              対戦表（{schedule.mode === 'doubles' ? 'ダブルス' : 'シングルス'}・{schedule.playerIds.length}人・コート{schedule.courts}）
            </h3>
            <button onClick={generate} className="rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30">再生成</button>
            <button
              onClick={addRound}
              disabled={!canAddRound}
              title={canAddRound ? undefined : '参加者が足りません（名簿から削除された人は追加できません）'}
              className="rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            >
              ラウンド追加
            </button>
            <button onClick={copy} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
              {copied ? 'コピーしました' : 'コピー'}
            </button>
          </div>

          <ul className="space-y-3">
            {schedule.rounds.map((round) => (
              <li key={round.index} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="mb-2 font-semibold">ラウンド{round.index + 1}</p>
                <ul className="space-y-1.5 text-sm">
                  {round.matches.map((mt) => (
                    <li key={mt.court} className="flex flex-wrap items-center gap-x-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-700 px-1.5 text-xs font-bold text-white">{mt.court}</span>
                      <span className="font-medium">{mt.team1.map(nameOf).join('・')}</span>
                      <span className="text-gray-400 dark:text-slate-500">vs</span>
                      <span className="font-medium">{mt.team2.map(nameOf).join('・')}</span>
                    </li>
                  ))}
                </ul>
                {round.resting.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">休憩: {round.resting.map(nameOf).join('・')}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-sm font-bold">各自の試合数</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-slate-300">
              {playCounts(schedule).map((p) => (
                <li key={p.id}>{nameOf(p.id)}: <b className="text-gray-900 dark:text-slate-100">{p.games}</b></li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
