import { useState } from 'react';
import { useRackets } from '../hooks/useRackets';
import { activeRackets, pastRacketLabel } from '../lib/racket';
import { activeShoes, pastShoeLabel } from '../lib/shoe';
import { useShoes } from '../hooks/useShoes';
import { useMatches } from '../hooks/useMatches';
import type { MatchRecord, MatchFormat, MatchSet } from '../types';
import { todayISO } from '../lib/date';
import { matchResult, resultLabel, formatLabel, formatScore, summarize, isPlayedSet, type MatchResult } from '../lib/match';
import { formatMinutes } from '../lib/stats';
import HistoryFilter from '../components/HistoryFilter';

const MAX_SETS = 5;
const blankRow = () => ({ my: '', opp: '' });
const initialRows = () => [blankRow(), blankRow(), blankRow()];

const resultStyle: Record<MatchResult, string> = {
  win: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  loss: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
  draw: 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400',
};

export default function MatchesPage() {
  const { rackets } = useRackets();
  // 記録の入力欄にはアーカイブしていないラケットだけを出す
  // （編集中は、使用中のラケットが無くてもフォームを出す。既存記録を直せなくなるのを防ぐため）
  const racketOptions = activeRackets(rackets);
  const { shoes } = useShoes();
  // シューズも同じく、アーカイブしていないものだけを選択肢に出す
  const shoeOptions = activeShoes(shoes);
  const { matches, addMatch, updateMatch, deleteMatch } = useMatches();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [racketId, setRacketId] = useState('');
  const [shoeId, setShoeId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [format, setFormat] = useState<MatchFormat>('singles');
  const [opponent, setOpponent] = useState('');
  const [partner, setPartner] = useState('');
  const [rows, setRows] = useState<{ my: string; opp: string }[]>(initialRows());
  const [durationMinutes, setDurationMinutes] = useState('90');
  const [notes, setNotes] = useState('');

  const racketName = (id: string) => rackets.find((r) => r.id === id)?.name ?? '(削除済みラケット)';
  const shoeName = (id: string | undefined) => {
    if (!id) return null;
    return shoes.find((s) => s.id === id)?.name ?? '(削除済みシューズ)';
  };

  // 過去の記録から名前の入力候補を使用回数の多い順で作る
  function suggestionsFrom(pick: (m: MatchRecord) => string | undefined): string[] {
    const counts = new Map<string, number>();
    for (const m of matches) {
      const value = (pick(m) ?? '').trim();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value);
  }
  const opponentSuggestions = suggestionsFrom((m) => m.opponent);
  const partnerSuggestions = suggestionsFrom((m) => m.partner);

  // 入力中の行から MatchSet[] を作る（0-0 の空行は除く）
  function buildSets(): MatchSet[] {
    return rows
      .map((r) => ({ myGames: Number(r.my) || 0, opponentGames: Number(r.opp) || 0 }))
      .filter(isPlayedSet);
  }
  const draftSets = buildSets();
  const draftResult = draftSets.length > 0 ? matchResult(draftSets) : null;

  function resetForm() {
    setEditingId(null);
    setRacketId('');
    setShoeId('');
    setDate(todayISO());
    setFormat('singles');
    setOpponent('');
    setPartner('');
    setRows(initialRows());
    setDurationMinutes('90');
    setNotes('');
  }

  function startEdit(m: MatchRecord) {
    setEditingId(m.id);
    setRacketId(m.racketId);
    setShoeId(m.shoeId ?? '');
    setDate(m.date);
    setFormat(m.format);
    setOpponent(m.opponent);
    setPartner(m.partner ?? '');
    setRows(m.sets.length ? m.sets.map((s) => ({ my: String(s.myGames), opp: String(s.opponentGames) })) : initialRows());
    setDurationMinutes(String(m.durationMinutes));
    setNotes(m.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setRow(i: number, key: 'my' | 'opp', value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!racketId || !opponent.trim()) return;
    const sets = buildSets();
    if (sets.length === 0) return;
    const payload = {
      racketId,
      shoeId,
      date,
      format,
      opponent: opponent.trim(),
      partner: format === 'doubles' ? partner.trim() : '',
      sets,
      durationMinutes: Number(durationMinutes) || 0,
      notes: notes.trim(),
    };
    if (editingId) {
      updateMatch(editingId, payload);
    } else {
      addMatch(payload);
    }
    resetForm();
  }

  // 絞り込み
  const [fRacket, setFRacket] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fKeyword, setFKeyword] = useState('');
  const filterActive = !!(fRacket || fFrom || fTo || fKeyword.trim());
  function clearFilters() {
    setFRacket('');
    setFFrom('');
    setFTo('');
    setFKeyword('');
  }

  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date));
  const kw = fKeyword.trim().toLowerCase();
  const filtered = sorted.filter((m) => {
    if (fRacket && m.racketId !== fRacket) return false;
    if (fFrom && m.date < fFrom) return false;
    if (fTo && m.date > fTo) return false;
    if (kw) {
      const haystack = `${m.opponent} ${m.partner ?? ''} ${m.notes} ${racketName(m.racketId)}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    return true;
  });
  const summary = summarize(filtered);

  const inputClass = 'rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5';

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">{editingId ? '試合を編集' : '試合を記録'}</h2>
        {racketOptions.length === 0 && !editingId ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">先に「ラケット」タブでラケットを登録してください（アーカイブ済みのみの場合は使用中に戻してください）。</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>形式</span>
              <div className="inline-flex w-fit overflow-hidden rounded-lg border border-gray-300 dark:border-slate-600">
                {(['singles', 'doubles'] as MatchFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`px-4 py-1.5 text-sm font-medium ${
                      format === f
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {formatLabel(f)}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              日付
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              試合時間（分）
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} min="1" className={inputClass} required />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              対戦相手
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                list="match-opponents"
                placeholder={format === 'doubles' ? '例: 田中・鈴木' : '例: 田中'}
                className={inputClass}
                required
              />
              <datalist id="match-opponents">
                {opponentSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            {format === 'doubles' && (
              <label className="flex flex-col gap-1 text-sm">
                味方（任意）
                <input type="text" value={partner} onChange={(e) => setPartner(e.target.value)} list="match-partners" placeholder="例: 佐藤" className={inputClass} />
                <datalist id="match-partners">
                  {partnerSuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm">
              ラケット
              <select value={racketId} onChange={(e) => setRacketId(e.target.value)} className={inputClass} required>
                <option value="">選択してください</option>
                {racketOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
                {/* アーカイブ済み・削除済みのラケットを選んでいた記録を編集しても、選択が消えないようにする */}
                {racketId && !racketOptions.some((r) => r.id === racketId) && (
                  <option value={racketId}>{pastRacketLabel(rackets, racketId)}</option>
                )}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              シューズ（任意）
              <select value={shoeId} onChange={(e) => setShoeId(e.target.value)} className={inputClass}>
                <option value="">未選択</option>
                {shoeOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                {/* アーカイブ済み・削除済みのシューズを選んでいた記録を編集しても、選択が消えないようにする */}
                {shoeId && !shoeOptions.some((s) => s.id === shoeId) && (
                  <option value={shoeId}>{pastShoeLabel(shoes, shoeId)}</option>
                )}
              </select>
            </label>

            <div className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>スコア（セットごとのゲーム数・自分 - 相手）</span>
              <div className="flex flex-col gap-2">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-14 text-xs text-gray-500 dark:text-slate-400">第{i + 1}セット</span>
                    <input type="number" min="0" value={r.my} onChange={(e) => setRow(i, 'my', e.target.value)} placeholder="自分" className={`w-20 ${inputClass}`} />
                    <span className="text-gray-400">-</span>
                    <input type="number" min="0" value={r.opp} onChange={(e) => setRow(i, 'opp', e.target.value)} placeholder="相手" className={`w-20 ${inputClass}`} />
                    {rows.length > 1 && (
                      <button type="button" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))} aria-label={`第${i + 1}セットを削除`} className="text-gray-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-1 flex items-center gap-3">
                {rows.length < MAX_SETS && (
                  <button type="button" onClick={() => setRows((prev) => [...prev, blankRow()])} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
                    ＋ セットを追加
                  </button>
                )}
                {draftResult && (
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${resultStyle[draftResult]}`}>
                    {resultLabel(draftResult)}（{formatScore(draftSets)}）
                  </span>
                )}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              メモ（任意）
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
            </label>

            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
                {editingId ? '更新する' : '記録する'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                  キャンセル
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">試合履歴</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">まだ試合の記録がありません。</p>
        ) : (
          <>
            <HistoryFilter
              rackets={rackets}
              racketId={fRacket}
              onRacketId={setFRacket}
              from={fFrom}
              onFrom={setFFrom}
              to={fTo}
              onTo={setFTo}
              keyword={fKeyword}
              onKeyword={setFKeyword}
              keywordPlaceholder="相手・味方・メモで検索"
              active={filterActive}
              onClear={clearFilters}
              resultCount={filtered.length}
              totalCount={sorted.length}
            />

            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">条件に一致する記録がありません。</p>
            ) : (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SummaryCard label="試合数" value={`${summary.total}`} />
                  <SummaryCard label="勝ち" value={`${summary.wins}`} accent="win" />
                  <SummaryCard label="負け" value={`${summary.losses}`} accent="loss" />
                  <SummaryCard label="勝率" value={summary.winRate !== null ? `${Math.round(summary.winRate * 100)}%` : '—'} sub={summary.draws > 0 ? `引分${summary.draws}` : undefined} />
                </div>

                <ul className="space-y-2">
                  {filtered.map((m) => {
                    const result = matchResult(m.sets);
                    return (
                      <li key={m.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${resultStyle[result]}`}>{resultLabel(result)}</span>
                              <span className="font-semibold">{formatScore(m.sets)}</span>
                              <span className="text-gray-500 dark:text-slate-400">vs {m.opponent}</span>
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-slate-400">
                              <span>{m.date}</span>
                              <span>{formatLabel(m.format)}</span>
                              {m.format === 'doubles' && m.partner && <span>味方: {m.partner}</span>}
                              <span>{racketName(m.racketId)}</span>
                              {shoeName(m.shoeId) && <span>👟 {shoeName(m.shoeId)}</span>}
                              <span>{formatMinutes(m.durationMinutes)}</span>
                            </p>
                            {m.notes && <p className="mt-0.5 text-gray-500 dark:text-slate-400">メモ: {m.notes}</p>}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button onClick={() => startEdit(m)} className="text-emerald-700 dark:text-emerald-400 hover:underline">編集</button>
                            <button onClick={() => deleteMatch(m.id)} className="text-red-600 dark:text-red-400 hover:underline">削除</button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'win' | 'loss' }) {
  const valueColor =
    accent === 'win' ? 'text-emerald-700 dark:text-emerald-400' : accent === 'loss' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-slate-100';
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}
