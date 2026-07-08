import { useStringingRecords } from '../hooks/useStringingRecords';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import { practiceByMonth, gutUsage, gutComparison, costStats, monthlySummary, formatMinutes } from '../lib/stats';
import { formatYen } from '../lib/cost';
import { todayISO } from '../lib/date';

export default function StatsPage() {
  const { records } = useStringingRecords();
  const { sessions } = usePracticeSessions();

  const monthly = practiceByMonth(sessions);
  const usage = gutUsage(records, sessions);
  const comparison = gutComparison(records, sessions);
  const cost = costStats(records, sessions);
  const thisMonth = monthlySummary(sessions, todayISO());

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const monthDiff = thisMonth.minutes - thisMonth.prevMinutes;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-bold">今月の練習</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="今月の練習時間" value={formatMinutes(thisMonth.minutes)} sub={`${thisMonth.month.replace('-', '年')}月`} />
          <StatCard label="今月の練習回数" value={`${thisMonth.count}回`} />
          <StatCard
            label="先月との差"
            value={monthDiff === 0 ? '±0分' : `${monthDiff > 0 ? '+' : '−'}${formatMinutes(Math.abs(monthDiff))}`}
            sub={`先月 ${formatMinutes(thisMonth.prevMinutes)}`}
          />
        </div>
      </section>

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
        <h2 className="mb-3 text-xl font-bold">コスト</h2>
        {cost.totalCost === 0 ? (
          <p className="text-sm text-gray-500">
            張り替え記録に「ガット代」「張り代」を入力すると、ここに費用が集計されます。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="累計コスト" value={formatYen(cost.totalCost)} sub={`張り替え${cost.costedCount}回分`} />
            <StatCard
              label="1回あたり"
              value={cost.avgCostPerStringing !== null ? formatYen(cost.avgCostPerStringing) : '—'}
            />
            <StatCard
              label="1時間あたり"
              value={cost.costPerHour !== null ? formatYen(cost.costPerHour) : '—'}
              sub="練習時間で換算"
            />
          </div>
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

      <section>
        <h2 className="mb-1 text-xl font-bold">ガット比較</h2>
        <p className="mb-3 text-sm text-gray-500">
          打感・持ち（1回あたりの使用時間）・コスパ（1時間あたり費用）を並べて比較します。各項目の一番良い値を
          <span className="font-medium text-emerald-700">緑色</span>で示します。
        </p>
        {comparison.length < 2 ? (
          <p className="text-sm text-gray-500">2種類以上のガットを記録すると比較できます。</p>
        ) : (
          <GutComparisonTable data={comparison} />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
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
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm p-4">
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

function GutComparisonTable({
  data,
}: {
  data: {
    gutName: string;
    count: number;
    avgRating: number | null;
    hoursPerStringing: number;
    costPerHour: number | null;
  }[];
}) {
  // 各項目の「一番良い値」を求める（打感★=高いほど良い / 持ち=長いほど良い / コスパ=安いほど良い）
  const ratings = data.map((d) => d.avgRating).filter((v): v is number => v !== null);
  const bestRating = ratings.length ? Math.max(...ratings) : null;
  const bestHours = Math.max(...data.map((d) => d.hoursPerStringing));
  const costs = data.map((d) => d.costPerHour).filter((v): v is number => v !== null);
  const bestCost = costs.length ? Math.min(...costs) : null;

  const best = 'font-bold text-emerald-700';

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
            <th className="px-3 py-2 font-medium">ガット名</th>
            <th className="px-3 py-2 text-right font-medium">張替回数</th>
            <th className="px-3 py-2 text-right font-medium">打感★</th>
            <th className="px-3 py-2 text-right font-medium">持ち（1回あたり）</th>
            <th className="px-3 py-2 text-right font-medium">コスパ（¥/時間）</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.gutName} className="border-b border-gray-100 last:border-0">
              <td className="px-3 py-2 font-medium">{d.gutName}</td>
              <td className="px-3 py-2 text-right text-gray-600">{d.count}回</td>
              <td className={`px-3 py-2 text-right ${d.avgRating !== null && d.avgRating === bestRating ? best : 'text-gray-600'}`}>
                {d.avgRating !== null ? `★${d.avgRating.toFixed(1)}` : '—'}
              </td>
              <td className={`px-3 py-2 text-right ${d.hoursPerStringing > 0 && d.hoursPerStringing === bestHours ? best : 'text-gray-600'}`}>
                {d.hoursPerStringing > 0 ? `${d.hoursPerStringing.toFixed(1)}時間` : '—'}
              </td>
              <td className={`px-3 py-2 text-right ${d.costPerHour !== null && d.costPerHour === bestCost ? best : 'text-gray-600'}`}>
                {d.costPerHour !== null ? formatYen(d.costPerHour) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GutUsageChart({
  data,
}: {
  data: { gutName: string; count: number; minutes: number; avgRating: number | null; cost: number }[];
}) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <ul className="space-y-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4">
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
                {formatMinutes(d.minutes)}・{d.count}回{d.cost > 0 ? `・${formatYen(d.cost)}` : ''}
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
