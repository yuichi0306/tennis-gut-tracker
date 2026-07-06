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
    <div className="flex flex-col items-end gap-0.5 text-xs">
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-emerald-100">
            {syncing ? '☁ 同期中…' : '☁ 同期中'}
            {user.displayName ? `：${user.displayName}` : ''}
          </span>
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="rounded border border-emerald-300 px-2 py-1 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="rounded bg-white px-3 py-1 font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
        >
          {busy ? 'ログイン中…' : 'Googleでログインして同期'}
        </button>
      )}
      {error && <span className="text-amber-200">{error}</span>}
    </div>
  );
}
