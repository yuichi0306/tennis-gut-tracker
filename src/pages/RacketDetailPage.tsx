import { Link, useParams } from 'react-router-dom';
import { useRackets } from '../hooks/useRackets';
import { useStringingRecords } from '../hooks/useStringingRecords';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import type { StringingRecord } from '../types';
import { formatMinutes } from '../lib/stats';
import { recordCost, formatYen } from '../lib/cost';
import { tensionFeelLabel, tensionFeelClass } from '../lib/tensionFeel';
import StarRating from '../components/StarRating';

export default function RacketDetailPage() {
  const { id = '' } = useParams();
  const { rackets } = useRackets();
  const { records } = useStringingRecords();
  const { sessions } = usePracticeSessions();

  const racket = rackets.find((r) => r.id === id) ?? null;

  const stringingsAsc = records
    .filter((r) => r.racketId === id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const practices = sessions.filter((s) => s.racketId === id);

  // 各練習の「張り替え後の累計使用時間（時間）」を求める。
  // その練習日以前で最も新しい張り替え日を基準に、同じ張り替え期間内で積み上げる。
  const cumHoursById = new Map<string, number | null>();
  const runningByPeriod = new Map<string, number>();
  const periodStart = (date: string): string | null => {
    let start: string | null = null;
    for (const st of stringingsAsc) {
      if (st.date <= date) start = st.date;
      else break;
    }
    return start;
  };
  [...practices]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .forEach((p) => {
      const ps = periodStart(p.date);
      if (ps === null) {
        cumHoursById.set(p.id, null); // 張り替え前の練習
        return;
      }
      const prev = runningByPeriod.get(ps) ?? 0;
      const cum = prev + p.durationMinutes;
      runningByPeriod.set(ps, cum);
      cumHoursById.set(p.id, cum / 60);
    });

  // タイムライン（新しい順）
  type Ev =
    | { kind: 'string'; date: string; sortKey: string; rec: StringingRecord }
    | { kind: 'practice'; date: string; sortKey: string; id: string; durationMinutes: number; tensionFeel?: string; notes: string };
  const events: Ev[] = [
    ...stringingsAsc.map((r): Ev => ({ kind: 'string', date: r.date, sortKey: `${r.date}-0`, rec: r })),
    ...practices.map((s): Ev => ({
      kind: 'practice',
      date: s.date,
      sortKey: `${s.date}-1`,
      id: s.id,
      durationMinutes: s.durationMinutes,
      tensionFeel: s.tensionFeel,
      notes: s.notes,
    })),
  ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  if (!racket) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 text-center">
        <p className="mb-3 text-gray-600">ラケットが見つかりませんでした。</p>
        <Link to="/rackets" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
          ラケット一覧へ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-emerald-700 hover:underline">← ダッシュボードへ</Link>
        <h2 className="mt-1 text-xl font-bold">{racket.name}</h2>
      </div>

      <section>
        <h3 className="mb-2 font-bold">テンション推移</h3>
        {stringingsAsc.length === 0 ? (
          <p className="text-sm text-gray-500">まだ張り替え記録がありません。</p>
        ) : (
          <TensionChart data={stringingsAsc} />
        )}
      </section>

      <section>
        <h3 className="mb-2 font-bold">タイムライン</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">まだ記録がありません。</p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => {
              if (ev.kind === 'string') {
                const r = ev.rec;
                return (
                  <li key={`s-${r.id}`} className="rounded border border-gray-200 border-l-4 border-l-emerald-500 bg-white p-3 text-sm">
                    <p className="font-semibold">🧵 {r.date} 張り替え</p>
                    <p>{r.gutName}（{r.gutType}） / メイン {r.mainTension}lbs・クロス {r.crossTension}lbs</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500">
                      {r.rating ? <span className="flex items-center gap-1">打感: <StarRating value={r.rating} size="sm" /></span> : null}
                      {recordCost(r) > 0 && <span>費用: {formatYen(recordCost(r))}</span>}
                      {r.shop && <span>張り場所: {r.shop}</span>}
                    </p>
                    {r.notes && <p className="text-gray-500">メモ: {r.notes}</p>}
                  </li>
                );
              }
              const cum = cumHoursById.get(ev.id);
              return (
                <li key={`p-${ev.id}`} className="rounded border border-gray-200 border-l-4 border-l-sky-400 bg-white p-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">🎾 {ev.date} 練習</span>
                    <span className="text-gray-600">{formatMinutes(ev.durationMinutes)}</span>
                    {ev.tensionFeel && (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tensionFeelClass(ev.tensionFeel as never)}`}>
                        {tensionFeelLabel(ev.tensionFeel as never)}
                      </span>
                    )}
                    {cum !== null && cum !== undefined && (
                      <span className="text-xs text-gray-400">張り替え後 約{cum.toFixed(1)}時間時点</span>
                    )}
                  </p>
                  {ev.notes && <p className="text-gray-500">メモ: {ev.notes}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// テンション推移の折れ線グラフ（メイン=濃い緑、クロス=水色）。
function TensionChart({ data }: { data: StringingRecord[] }) {
  const tensions = data.flatMap((d) => [d.mainTension, d.crossTension]).filter((t) => t > 0);
  const min = Math.min(...tensions) - 2;
  const max = Math.max(...tensions) + 2;
  const range = Math.max(max - min, 1);

  const stepX = 64;
  const padX = 40;
  const topPad = 24;
  const plotHeight = 140;
  const labelHeight = 34;
  const width = padX * 2 + Math.max(data.length - 1, 1) * stepX;
  const height = topPad + plotHeight + labelHeight;

  const x = (i: number) => padX + i * stepX;
  const y = (t: number) => topPad + plotHeight - ((t - min) / range) * plotHeight;

  const line = (key: 'mainTension' | 'crossTension') =>
    data.map((d, i) => `${x(i)},${y(d[key])}`).join(' ');

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm p-4">
      <svg width={width} height={height} role="img" aria-label="テンション推移グラフ">
        {data.length > 1 && (
          <>
            <polyline points={line('mainTension')} fill="none" className="stroke-emerald-600" strokeWidth={2} />
            <polyline points={line('crossTension')} fill="none" className="stroke-sky-400" strokeWidth={2} strokeDasharray="4 3" />
          </>
        )}
        {data.map((d, i) => (
          <g key={d.id}>
            <circle cx={x(i)} cy={y(d.mainTension)} r={3} className="fill-emerald-600" />
            <text x={x(i)} y={y(d.mainTension) - 6} textAnchor="middle" className="fill-emerald-700 text-[10px]">
              {d.mainTension}
            </text>
            <circle cx={x(i)} cy={y(d.crossTension)} r={3} className="fill-sky-400" />
            <text x={x(i)} y={topPad + plotHeight + 16} textAnchor="middle" className="fill-gray-600 text-[10px]">
              {d.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-emerald-600" />メイン</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-sky-400" />クロス</span>
        <span className="text-gray-400">数値=メインのテンション(lbs)</span>
      </div>
    </div>
  );
}
