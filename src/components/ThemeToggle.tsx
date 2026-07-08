import { useState } from 'react';
import { resolveTheme, setTheme, type Theme } from '../lib/theme';

// ヘッダーの表示テーマ切り替えボタン（ライト⇔ダーク）。
export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme());

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      className="shrink-0 rounded-lg px-2 py-1.5 text-base leading-none text-white/90 hover:bg-white/15"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
