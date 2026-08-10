import { useEffect, useRef } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { useRestringSummary } from './hooks/useRestringSummary';
import { setAppBadge, notifyRestring, notifyPermission } from './lib/notify';
import DashboardPage from './pages/DashboardPage';
import RacketsPage from './pages/RacketsPage';
import RacketDetailPage from './pages/RacketDetailPage';
import ShoesPage from './pages/ShoesPage';
import StringingPage from './pages/StringingPage';
import PracticePage from './pages/PracticePage';
import MatchesPage from './pages/MatchesPage';
import WishlistPage from './pages/WishlistPage';
import PackingPage from './pages/PackingPage';
import StatsPage from './pages/StatsPage';
import DataPage from './pages/DataPage';
import SettingsPage from './pages/SettingsPage';
import ManualPage from './pages/ManualPage';
import MatchmakerPage from './pages/MatchmakerPage';
import AuthBar from './components/AuthBar';
import ThemeToggle from './components/ThemeToggle';
import NavTabs from './components/NavTabs';

// タブの一覧と並び順は src/lib/navOrder.ts（ユーザーがドラッグで並び替えできる）。
// マニュアル(/manual)はタブには出さず、ヘッダー右上の「使い方」ボタンから開く。

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
            <Link
              to="/manual"
              aria-label="使い方（マニュアル）"
              title="使い方（マニュアル）"
              className="flex shrink-0 items-center justify-center rounded-lg border border-white/40 px-2 py-1.5 text-sm font-semibold leading-none text-white/90 hover:bg-white/15"
            >
              使い方
            </Link>
          </div>
        </div>
        <NavTabs badges={{ '/': summary.overdue }} />
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rackets" element={<RacketsPage />} />
          <Route path="/racket/:id" element={<RacketDetailPage />} />
          <Route path="/shoes" element={<ShoesPage />} />
          <Route path="/stringing" element={<StringingPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/matchmaker" element={<MatchmakerPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/packing" element={<PackingPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/manual" element={<ManualPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
