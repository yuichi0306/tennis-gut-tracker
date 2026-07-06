import { useStringingRecords } from '../hooks/useStringingRecords';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import { practiceByMonth, gutUsage, formatMinutes } from '../lib/stats';

export default function StatsPage() {
  const { records } = useStringingRecords();
  const { sessions } = usePracticeSessions();

  const monthly = practiceByMonth(sessions);
  const usage = gutUsage(records, sessions);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-xl font-bold">月別の練習時間</h2>
        <p className="mb-3 text-sm text-gray-500">累計 {formatMinutes(totalMinutes)}（全 {sessions.length} 回）</p>
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-500">まだ練習記録がありません。</p>
        ) : (
          <MonthlyChart data={monthly} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">ガット別の使用傾向</h2>
        {usage.length === 0 ? (
          <p className="text-sm text-gray-500">まだ張り替え記録がありません。</p>
        ) : (
          <GutUsageChart data={usage} />
        )}
      </section>
    </div>
  );
}

function MonthlyChart({ data }: { data: { month: string; minutes: number }[] }) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  const barGap = 12;
  const barWidth = 36;
  const topPad = 18; // 棒の上に出る時間ラベル用の余白
  const chartHeight = 160;
  const labelHeight = 40;
  const width = data.length * (barWidth + barGap) + barGap;
  const height = topPad + chartHeight + labelHeight;

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white p-4">
      <svg width={width} height={height} role="img" aria-label="月別練習時間の棒グラフ">
        {data.map((d, i) => {
          const barHeight = (d.minutes / maxMinutes) * chartHeight;
          const x = barGap + i * (barWidth + barGap);
          const y = topPad + chartHeight - barHeight;
          const [, mm] = d.month.split('-');
          return (
            <g key={d.month}>
              {d.minutes > 0 && (
                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="fill-gray-500 text-[10px]">
                  {Math.round((d.minutes / 60) * 10) / 10}h
                </text>
              )}
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} className="fill-emerald-600" />
              <text x={x + barWidth / 2} y={topPad + chartHeight + 16} textAnchor="middle" className="fill-gray-600 text-[10px]">
                {Number(mm)}月
              </text>
              <text x={x + barWidth / 2} y={topPad + chartHeight + 30} textAnchor="middle" className="fill-gray-400 text-[9px]">
                {d.month.slice(0, 4)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GutUsageChart({
  data,
}: {
  data: { gutName: string; count: number; minutes: number; avgRating: number | null }[];
}) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <ul className="space-y-3 rounded border border-gray-200 bg-white p-4">
      {data.map((d) => {
        const pct = (d.minutes / maxMinutes) * 100;
        return (
          <li key={d.gutName}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                {d.gutName}
                {d.avgRating !== null && (
                  <span className="ml-2 text-xs font-normal text-amber-500">
                    ★{d.avgRating.toFixed(1)}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-gray-500">
                {formatMinutes(d.minutes)}・{d.count}回
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded bg-gray-100">
              <div className="h-full rounded bg-emerald-600" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
