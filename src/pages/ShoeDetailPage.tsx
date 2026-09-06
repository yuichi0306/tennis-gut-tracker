import { Link, useParams } from 'react-router-dom';
import { useShoes } from '../hooks/useShoes';
import { useRackets } from '../hooks/useRackets';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import { useMatches } from '../hooks/useMatches';
import { useSettings } from '../hooks/useSettings';
import { getShoeUsage, type ShoeStatus } from '../lib/shoe';
import { formatMinutes } from '../lib/stats';
import { formatYen } from '../lib/cost';
import { elapsedLabel } from '../lib/date';
import { tensionFeelLabel, tensionFeelClass } from '../lib/tensionFeel';
import { matchResult, resultLabel, formatScore } from '../lib/match';

const statusStyles: Record<ShoeStatus, { label: string; badge: string; bar: string }> = {
  ok: {
    label: '問題なし',
    badge: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-600',
  },
  warning: {
    label: 'そろそろ買い替え時期',
    badge: 'border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  overdue: {
    label: '買い替え推奨',
    badge: 'border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
  },
};

export default function ShoeDetailPage() {
  const { id = '' } = useParams();
  const { shoes } = useShoes();
  const { rackets } = useRackets();
  const { sessions } = usePracticeSessions();
  const { matches } = useMatches();
  const { settings } = useSettings();

  const shoe = shoes.find((s) => s.id === id) ?? null;
  const racketName = (racketId: string) => rackets.find((r) => r.id === racketId)?.name ?? '(削除済みラケット)';

  // このシューズを履いた練習・試合
  const practices = sessions.filter((s) => s.shoeId === id);
  const shoeMatches = matches.filter((m) => m.shoeId === id);

  // 各プレーの「そこまでの累計使用時間」を求める。
  // ラケットは張り替えでリセットされるが、シューズは買ってからずっと積み上がる。
  type Play = {
    kind: 'practice' | 'match';
    id: string;
    date: string;
    sortKey: string;
    durationMinutes: number;
    racketId: string;
    label: string; // 試合の勝敗・スコア（練習は空）
    courtName: string;
    surface: string;
    tensionFeel?: string;
    notes: string;
  };
  const plays: Play[] = [
    ...practices.map((p): Play => ({
      kind: 'practice',
      id: p.id,
      date: p.date,
      sortKey: `${p.date}-1`,
      durationMinutes: p.durationMinutes,
      racketId: p.racketId,
      label: '',
      courtName: p.courtName ?? '',
      surface: p.surface ?? '',
      tensionFeel: p.tensionFeel,
      notes: p.notes,
    })),
    ...shoeMatches.map((m): Play => ({
      kind: 'match',
      id: m.id,
      date: m.date,
      sortKey: `${m.date}-2`,
      durationMinutes: m.durationMinutes,
      racketId: m.racketId,
      label: `${resultLabel(matchResult(m.sets))} ${formatScore(m.sets)} vs ${m.opponent}`,
      courtName: m.courtName ?? '',
      surface: m.surface ?? '',
      notes: m.notes,
    })),
  ];

  const cumHoursById = new Map<string, number>();
  let running = 0;
  [...plays]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.id.localeCompare(b.id))
    .forEach((p) => {
      running += p.durationMinutes;
      cumHoursById.set(p.id, running / 60);
    });

  // タイムラインは新しい順
  const events = [...plays].sort((a, b) => b.sortKey.localeCompare(a.sortKey) || b.id.localeCompare(a.id));

  if (!shoe) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="mb-3 text-gray-600 dark:text-slate-300">シューズが見つかりませんでした。</p>
        <Link to="/shoes" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
          シューズ一覧へ
        </Link>
      </div>
    );
  }

  const usage = getShoeUsage(shoe, sessions, settings.shoeHours, matches);
  const style = statusStyles[usage.status];
  const pct = Math.min((usage.hoursPlayed / settings.shoeHours) * 100, 100);
  const elapsed = elapsedLabel(shoe.purchaseDate);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/shoes" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">← シューズ一覧へ</Link>
        <h2 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold">
          {shoe.name}
          {shoe.archived && (
            <span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs font-normal text-gray-500 dark:border-slate-600 dark:text-slate-400">
              アーカイブ済み
            </span>
          )}
        </h2>
        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-slate-400">
          {shoe.surface && <span>{shoe.surface}</span>}
          {shoe.price > 0 && <span>{formatYen(shoe.price)}</span>}
          {shoe.purchaseDate && (
            <span>
              購入日 {shoe.purchaseDate}
              {elapsed && `（購入から${elapsed}）`}
            </span>
          )}
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-bold">使用状況</h3>
          {shoe.archived ? (
            <span className="shrink-0 rounded-full border border-gray-300 px-3 py-0.5 text-xs font-medium text-gray-500 dark:border-slate-600 dark:text-slate-400">
              アーカイブ済み
            </span>
          ) : (
            <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span>
          )}
        </div>
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="text-gray-600 dark:text-slate-300">
            使用時間 約{usage.hoursPlayed.toFixed(1)}時間 / 基準{settings.shoeHours}時間
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400">{usage.sessionCount}回</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-gray-100 dark:bg-slate-700">
          <div className={`h-full rounded ${shoe.archived ? 'bg-gray-400' : style.bar}`} style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-slate-400">
          <span>練習 {practices.length}回 / 試合 {shoeMatches.length}回</span>
          {usage.costPerHour !== null && <span>1時間あたり {formatYen(usage.costPerHour)}</span>}
        </p>
        {shoe.notes && <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">メモ: {shoe.notes}</p>}
      </section>

      <section>
        <h3 className="mb-2 font-bold">タイムライン</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            まだこのシューズで記録がありません。練習・試合を記録するときに「シューズ」で選んでください。
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => {
              const cum = cumHoursById.get(ev.id);
              const isMatch = ev.kind === 'match';
              return (
                <li
                  key={`${ev.kind}-${ev.id}`}
                  className={`rounded border border-gray-200 border-l-4 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800 ${
                    isMatch ? 'border-l-amber-400' : 'border-l-sky-400'
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {isMatch ? '🏆' : '🎾'} {ev.date} {isMatch ? '試合' : '練習'}
                    </span>
                    {ev.label && <span className="text-gray-600 dark:text-slate-300">{ev.label}</span>}
                    <span className="text-gray-500 dark:text-slate-400">{formatMinutes(ev.durationMinutes)}</span>
                    {/* 行頭の 🎾/🏆 は練習・試合の印なので、ラケット名は絵文字なしで出す */}
                    <span className="text-gray-500 dark:text-slate-400">ラケット: {racketName(ev.racketId)}</span>
                    {ev.courtName && <span className="text-gray-500 dark:text-slate-400">📍 {ev.courtName}</span>}
                    {ev.surface && (
                      <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 dark:border-slate-600 dark:text-slate-300">
                        {ev.surface}
                      </span>
                    )}
                    {ev.tensionFeel && (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tensionFeelClass(ev.tensionFeel as never)}`}>
                        {tensionFeelLabel(ev.tensionFeel as never)}
                      </span>
                    )}
                    {cum !== undefined && (
                      <span className="text-xs text-gray-400 dark:text-slate-500">通算 約{cum.toFixed(1)}時間時点</span>
                    )}
                  </p>
                  {ev.notes && <p className="text-gray-500 dark:text-slate-400">メモ: {ev.notes}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
