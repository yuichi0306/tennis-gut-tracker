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
import ThemeToggle from './components/ThemeToggle';

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
    <div className="min-h-screen text-gray-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-sm dark:border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="flex min-w-0 items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
            <span className="text-xl leading-none" aria-hidden>🎾</span>
            <span className="truncate">テニスノート</span>
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <AuthBar />
          </div>
        </div>
        <nav className="mx-auto max-w-4xl px-2">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {navItems.map((item) => {
              const badge = item.to === '/' ? summary.overdue : 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex shrink-0 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-emerald-50 hover:bg-white/15'
                    }`
                  }
                >
                  {item.label}
                  {badge > 0 && (
                    <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white/30">
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
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
