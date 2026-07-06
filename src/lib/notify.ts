// ブラウザ通知・アプリアイコンバッジのユーティリティ。
// 無料構成のため「サーバーからのプッシュ」ではなく、アプリを開いた時に知らせる方式。

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export function canNotify(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notifyPermission(): NotificationPermission {
  return canNotify() ? Notification.permission : 'denied';
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!canNotify()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

// 張り替え推奨の通知を出す（許可済みのときのみ）。
export function notifyRestring(overdue: number, names: string[]): void {
  if (!canNotify() || Notification.permission !== 'granted' || overdue <= 0) return;
  const shown = names.slice(0, 3).join('、');
  const extra = names.length > 3 ? ' ほか' : '';
  const body = shown ? `${shown}${extra}` : `${overdue}本のラケット`;
  try {
    new Notification('🎾 ガットの張り替え時期です', {
      body: `${overdue}本が張り替え推奨です：${body}`,
      icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    });
  } catch {
    // 通知作成に失敗しても致命的ではないので無視
  }
}

// PWAアイコンのバッジ（対応端末のみ）。count が 0 なら消す。
export function setAppBadge(count: number): void {
  const nav = navigator as BadgeNavigator;
  if (count > 0) {
    nav.setAppBadge?.(count).catch(() => {});
  } else {
    nav.clearAppBadge?.().catch(() => {});
  }
}
