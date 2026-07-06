import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRackets } from '../hooks/useRackets';
import { useStringingRecords } from '../hooks/useStringingRecords';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import { useSettings } from '../hooks/useSettings';
import { useRestringSummary } from '../hooks/useRestringSummary';
import { getRestringInfo, type RestringStatus } from '../lib/restring';
import { canNotify, notifyPermission, requestNotifyPermission } from '../lib/notify';

const statusStyles: Record<RestringStatus, { label: string; className: string }> = {
  'no-record': { label: '張り替え記録なし', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  ok: { label: '問題なし', className: 'bg-green-50 text-green-700 border-green-300' },
  warning: { label: 'そろそろ張り替え時期', className: 'bg-amber-50 text-amber-700 border-amber-300' },
  overdue: { label: '張り替え推奨', className: 'bg-red-50 text-red-700 border-red-300' },
};

export default function DashboardPage() {
  const { rackets } = useRackets();
  const { records } = useStringingRecords();
  const { sessions } = usePracticeSessions();
  const { settings } = useSettings();
  const summary = useRestringSummary();
  const [permission, setPermission] = useState<NotificationPermission>(notifyPermission());

  async function enableNotifications() {
    const result = await requestNotifyPermission();
    setPermission(result);
  }

  if (rackets.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-white p-6 text-center">
        <p className="mb-3 text-gray-600">まだラケットが登録されていません。</p>
        <Link to="/rackets" className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          ラケットを登録する
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">張り替え時期の状況</h2>

      {(summary.overdue > 0 || summary.warning > 0) && (
        <div className="rounded border border-gray-200 bg-white p-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {summary.overdue > 0 && (
              <span className="font-semibold text-red-700">🔴 張り替え推奨 {summary.overdue}本</span>
            )}
            {summary.warning > 0 && (
              <span className="font-semibold text-amber-700">🟡 そろそろ {summary.warning}本</span>
            )}
          </div>
        </div>
      )}

      {canNotify() && permission === 'default' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <span className="text-emerald-800">
            通知をオンにすると、アプリを開いたときに張り替え時期をお知らせします。
          </span>
          <button
            onClick={enableNotifications}
            className="shrink-0 rounded bg-emerald-700 px-3 py-1.5 font-medium text-white hover:bg-emerald-800"
          >
            通知をオンにする
          </button>
        </div>
      )}
      {canNotify() && permission === 'denied' && (
        <p className="text-xs text-gray-400">
          通知はブラウザ側でブロックされています。お知らせを受け取るにはブラウザの設定で許可してください。
        </p>
      )}

      <ul className="space-y-3">
        {rackets.map((racket) => {
          const info = getRestringInfo(racket.id, records, sessions, settings);
          const style = statusStyles[info.status];
          return (
            <li key={racket.id} className={`rounded border p-4 ${style.className}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{racket.name}</span>
                <span className="rounded-full border px-3 py-0.5 text-xs font-medium">{style.label}</span>
              </div>
              {info.latestStringing ? (
                <div className="mt-2 text-sm">
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
                </div>
              ) : (
                <p className="mt-2 text-sm">
                  <Link to="/stringing" className="underline">
                    ガット張り替え記録を追加してください
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-400">
        目安: ガット種類ごとの使用時間・経過日数の基準に達すると「張り替え推奨」、その80%で「そろそろ」と表示します。
        基準は<Link to="/settings" className="underline">設定</Link>で変更できます。
      </p>
    </div>
  );
}
