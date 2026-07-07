import { useEffect, useRef } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useRestringSummary } from './hooks/useRestringSummary';
import { setAppBadge, notifyRestring, notifyPermission } from './lib/notify';
import DashboardPage from './pages/DashboardPage';
import RacketsPage from './pages/RacketsPage';
import RacketDetailPage from './pages/RacketDetailPage';
import StringingPage from './pages/StringingPage';
import PracticePage from './pages/PracticePage';
import StatsPage from './pages/StatsPage';
import DataPage from './pages/DataPage';
import SettingsPage from './pages/SettingsPage';
import AuthBar from './components/AuthBar';

const navItems = [
  { to: '/', label: 'ダッシュボード', end: true },
  { to: '/rackets', label: 'ラケット' },
  { to: '/stringing', label: 'ガット張り替え' },
  { to: '/practice', label: '練習記録' },
  { to: '/stats', label: '統計' },
  { to: '/data', label: 'データ' },
  { to: '/settings', label: '設定' },
];

function App() {
  const summary = useRestringSummary();
  const notifiedRef = useRef(false);

  // PWAアイコンのバッジを張り替え推奨の本数に同期
  useEffect(() => {
    setAppBadge(summary.overdue);
  }, [summary.overdue]);

  // アプリを開いたとき、張り替え推奨があれば一度だけ通知
  useEffect(() => {
    if (!notifiedRef.current && summary.overdue > 0 && notifyPermission() === 'granted') {
      notifyRestring(summary.overdue, summary.overdueNames);
      notifiedRef.current = true;
    }
  }, [summary.overdue, summary.overdueNames]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-emerald-700 text-white shadow">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-lg font-bold">🎾 ガット使用歴トラッカー</h1>
          <AuthBar />
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-2 overflow-x-auto">
          {navItems.map((item) => {
            const badge = item.to === '/' ? summary.overdue : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-gray-50 text-emerald-800' : 'text-emerald-100 hover:bg-emerald-600'
                  }`
                }
              >
                {item.label}
                {badge > 0 && (
                  <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rackets" element={<RacketsPage />} />
          <Route path="/racket/:id" element={<RacketDetailPage />} />
          <Route path="/stringing" element={<StringingPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
