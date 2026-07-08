// 表示テーマ（ライト／ダーク）の解決・保存・適用。
// 初期適用は index.html のインラインスクリプトが行い（ちらつき防止）、
// ここでは主に手動トグルとReact側の状態同期に使う。

export type Theme = 'light' | 'dark';

const THEME_KEY = 'tennis-tracker:theme';

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

// 保存済みテーマ。未設定なら OS 設定にフォールバック。
export function resolveTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return systemPrefersDark() ? 'dark' : 'light';
}

// テーマを保存し、<html> に反映する。
export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}
