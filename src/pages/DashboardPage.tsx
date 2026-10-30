import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRackets } from '../hooks/useRackets';
import { useStringingRecords } from '../hooks/useStringingRecords';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import { useMatches } from '../hooks/useMatches';
import { useSettings } from '../hooks/useSettings';
import { useRestringSummary } from '../hooks/useRestringSummary';
import { getRestringInfo, type RestringStatus } from '../lib/restring';
import { getRestringForecast, forecastText, forecastReason } from '../lib/forecast';
import { canNotify, notifyPermission, requestNotifyPermission } from '../lib/notify';
import { activeRackets } from '../lib/racket';
import { useShoes } from '../hooks/useShoes';
import { useGoal } from '../hooks/useGoal';
import { activeShoes, getShoeUsage, type ShoeStatus } from '../lib/shoe';
import { openTasks } from '../lib/goal';

const BANNER_DISMISS_KEY = 'tennis-tracker:restring-banner-dismissed';

const statusStyles: Record<RestringStatus, { label: string; card: string; badge: string; dot: string }> = {
  'no-record': { label: '張り替え記録なし', card: 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800', badge: 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400', dot: 'bg-gray-300' },
  ok: { label: '問題なし', card: 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800', badge: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  warning: { label: 'そろそろ張り替え時期', card: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30', badge: 'border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  overdue: { label: '張り替え推奨', card: 'border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30', badge: 'border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
};

// シューズの状態ごとの見た目（シューズ画面と同じ配色に合わせる）
const shoeStatusStyles: Record<ShoeStatus, { label: string; badge: string; bar: string }> = {
  ok: { label: '問題なし', badge: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-600' },
  warning: { label: 'そろそろ買い替え', badge: 'border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  overdue: { label: '買い替え推奨', badge: 'border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400', bar: 'bg-red-500' },
};

export default function DashboardPage() {
  const { rackets } = useRackets();
  const { shoes } = useShoes();
  const { goal, tasks } = useGoal();
  const { records } = useStringingRecords();
  const { sessions } = usePracticeSessions();
  const { matches } = useMatches();
  const { settings } = useSettings();
  const summary = useRestringSummary();
  const [permission, setPermission] = useState<NotificationPermission>(notifyPermission());

  // 要張り替えバナー：本数の状況を署名にし、閉じた状況と一致する間は非表示にする
  const alertSignature = `${summary.overdue}-${summary.warning}`;
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(
    () => localStorage.getItem(BANNER_DISMISS_KEY),
  );
  const showBanner = (summary.overdue > 0 || summary.warning > 0) && dismissedSignature !== alertSignature;

  function dismissBanner() {
    localStorage.setItem(BANNER_DISMISS_KEY, alertSignature);
    setDismissedSignature(alertSignature);
  }

  async function enableNotifications() {
    const result = await requestNotifyPermission();
    setPermission(result);
  }

  // アーカイブしたラケットはダッシュボードに出さない（記録は残っている）
  const shown = activeRackets(rackets);

  const goalCard = <GoalSummary goal={goal} openCount={openTasks(tasks).length} />;

  if (shown.length === 0) {
    return (
      <div className="space-y-4">
        {goalCard}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6 text-center">
        <p className="mb-3 text-gray-600 dark:text-slate-300">
          {rackets.length === 0
            ? 'まだラケットが登録されていません。'
            : '使用中のラケットがありません。アーカイブしたラケットは「ラケット」タブで戻せます。'}
        </p>
        <Link to="/rackets" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
          {rackets.length === 0 ? 'ラケットを登録する' : 'ラケット一覧へ'}
        </Link>
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goalCard}

      <h2 className="text-xl font-bold">張り替え時期の状況</h2>

      {showBanner && (
        <div className="flex items-start justify-between gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {summary.overdue > 0 && (
              <span className="font-semibold text-red-700 dark:text-red-300">🔴 張り替え推奨 {summary.overdue}本</span>
            )}
            {summary.warning > 0 && (
              <span className="font-semibold text-amber-700 dark:text-amber-300">🟡 そろそろ {summary.warning}本</span>
            )}
          </div>
          <button
            onClick={dismissBanner}
            aria-label="このお知らせを閉じる"
            title="確認しました（閉じる）"
            className="shrink-0 rounded px-2 leading-none text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {canNotify() && permission === 'default' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm">
          <span className="text-emerald-800 dark:text-emerald-300">
            通知をオンにすると、アプリを開いたときに張り替え時期をお知らせします。
          </span>
          <button
            onClick={enableNotifications}
            className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            通知をオンにする
          </button>
        </div>
      )}
      {canNotify() && permission === 'denied' && (
        <p className="text-xs text-gray-400 dark:text-slate-500">
          通知はブラウザ側でブロックされています。お知らせを受け取るにはブラウザの設定で許可してください。
        </p>
      )}

      <ul className="space-y-3">
        {shown.map((racket) => {
          const info = getRestringInfo(racket.id, records, sessions, settings, matches);
          const forecast = getRestringForecast(info, racket.id, sessions, matches);
          const style = statusStyles[info.status];
          return (
            <li key={racket.id} className={`rounded-xl border p-4 shadow-sm ${style.card}`}>
              <div className="flex items-center justify-between gap-2">
                <Link to={`/racket/${racket.id}`} className="flex items-center gap-2 font-semibold hover:underline">
                  <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
                  {racket.name}
                </Link>
                <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span>
              </div>
              {info.latestStringing ? (
                <div className="mt-2 space-y-0.5 text-sm text-gray-600 dark:text-slate-300">
                  <p>
                    最終張り替え: {info.latestStringing.date}（{info.daysSinceStringing}日経過
                    {info.threshold && ` / 基準${info.threshold.days}日`}）
                  </p>
                  <p>
                    {info.latestStringing.gutName}（{info.latestStringing.gutType}） / メイン {info.latestStringing.mainTension}lbs・クロス {info.latestStringing.crossTension}lbs
                  </p>
                  <p>
                    張り替え後の使用時間: 約{info.hoursPlayedSinceStringing.toFixed(1)}時間
                    {info.threshold && ` / 基準${info.threshold.hours}時間`}
                  </p>
                  {forecast && (
                    <p className="pt-0.5">
                      <span className="font-medium text-gray-700 dark:text-slate-200">
                        🔮 次の張り替え予測: {forecastText(forecast)}
                      </span>
                      <span className="block text-xs text-gray-400 dark:text-slate-500">
                        {forecastReason(forecast)}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm">
                  <Link to="/stringing" className="font-medium text-emerald-700 dark:text-emerald-400 underline">
                    ガット張り替え記録を追加してください
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <ShoeSummary shoes={activeShoes(shoes)} sessions={sessions} matches={matches} shoeHours={settings.shoeHours} />

      <p className="text-xs text-gray-400 dark:text-slate-500">
        目安: ガット種類ごとの使用時間・経過日数の基準に達すると「張り替え推奨」、その80%で「そろそろ」と表示します。
        基準は<Link to="/settings" className="underline">設定</Link>で変更できます。
        予測は直近のプレーペースがそのまま続く前提の目安なので、練習量が変わればズレます。
      </p>
    </div>
  );
}

// 大目標のまとめ。詳しくは「目標」タブで見る。
function GoalSummary({ goal, openCount }: { goal: ReturnType<typeof useGoal>['goal']; openCount: number }) {
  return (
    <Link
      to="/goal"
      className="block rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">🎯 大目標</p>
          <p className="mt-0.5 text-lg font-bold">{goal.bigGoal || '（未設定）'}</p>
          <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-600 dark:text-slate-300">
            {goal.currentClass && <span>いま: {goal.currentClass}</span>}
            {goal.pace && <span>ペース: {goal.pace}</span>}
            <span>取り組み中の課題: {openCount}件</span>
          </p>
        </div>
        <span className="shrink-0 text-xs text-emerald-700 dark:text-emerald-400">詳しく →</span>
      </div>
    </Link>
  );
}

// 使用中のシューズ。アーカイブしたものは出さない。1足も無いときは何も出さない。
function ShoeSummary({
  shoes,
  sessions,
  matches,
  shoeHours,
}: {
  shoes: ReturnType<typeof useShoes>['shoes'];
  sessions: ReturnType<typeof usePracticeSessions>['sessions'];
  matches: ReturnType<typeof useMatches>['matches'];
  shoeHours: number;
}) {
  if (shoes.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-xl font-bold">使用中のシューズ</h2>
      <ul className="space-y-2">
        {shoes.map((shoe) => {
          const usage = getShoeUsage(shoe, sessions, shoeHours, matches);
          const style = shoeStatusStyles[usage.status];
          const pct = Math.min((usage.hoursPlayed / shoeHours) * 100, 100);
          return (
            <li key={shoe.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/shoe/${shoe.id}`} className="min-w-0 truncate font-semibold hover:underline">
                  👟 {shoe.name}
                </Link>
                <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span>
              </div>
              <div className="mt-2">
                <div className="mb-1 flex items-baseline justify-between text-xs text-gray-600 dark:text-slate-300">
                  <span>使用時間 約{usage.hoursPlayed.toFixed(1)}時間 / 基準{shoeHours}時間</span>
                  <span className="text-gray-500 dark:text-slate-400">{usage.sessionCount}回</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-gray-100 dark:bg-slate-700">
                  <div className={`h-full rounded ${style.bar}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
