import { NavLink, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import RacketsPage from './pages/RacketsPage';
import StringingPage from './pages/StringingPage';
import PracticePage from './pages/PracticePage';
import StatsPage from './pages/StatsPage';

const navItems = [
  { to: '/', label: 'ダッシュボード', end: true },
  { to: '/rackets', label: 'ラケット' },
  { to: '/stringing', label: 'ガット張り替え' },
  { to: '/practice', label: '練習記録' },
  { to: '/stats', label: '統計' },
];

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-emerald-700 text-white shadow">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <h1 className="text-lg font-bold">🎾 ガット使用歴トラッカー</h1>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-2 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-gray-50 text-emerald-800' : 'text-emerald-100 hover:bg-emerald-600'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rackets" element={<RacketsPage />} />
          <Route path="/stringing" element={<StringingPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
