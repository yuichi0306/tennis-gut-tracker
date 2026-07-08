import { useState } from 'react';
import { useData } from '../context/DataContext';

// ヘッダー右側のログイン状態表示・ログイン/ログアウトボタン。
export default function AuthBar() {
  const { user, authReady, syncing, signIn, signOut } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await signIn();
    } catch (e) {
      // ポップアップを閉じただけの場合はエラー表示しない
      const code = (e as { code?: string })?.code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('ログインに失敗しました。時間をおいて再度お試しください。');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  if (!authReady) return null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
      {user ? (
        <div className="flex items-center gap-2">
          <span className="hidden text-emerald-100 sm:inline">
            {syncing ? '☁ 同期中…' : '☁ 同期中'}
            {user.displayName ? `：${user.displayName}` : ''}
          </span>
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="whitespace-nowrap rounded-lg border border-emerald-300/70 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="shrink-0 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-50"
        >
          {busy ? 'ログイン中…' : '☁ ログインして同期'}
        </button>
      )}
      {error && <span className="text-amber-200">{error}</span>}
    </div>
  );
}
