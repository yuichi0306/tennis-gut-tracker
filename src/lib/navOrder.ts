// ヘッダーのタブ（ナビ）の並び順。表示テーマと同じく「この端末の見た目の好み」なので、
// 端末間同期・バックアップの対象にはせず localStorage だけに保存する。

export interface NavItem {
  to: string;
  label: string;
  end?: boolean; // NavLink の完全一致判定（'/' のみ）
}

// 既定の並び順。マニュアル(/manual)はタブに出さず、ヘッダー右上の「使い方」から開く。
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'ダッシュボード', end: true },
  { to: '/rackets', label: 'ラケット' },
  { to: '/shoes', label: 'シューズ' },
  { to: '/stringing', label: 'ガット張り替え' },
  { to: '/practice', label: '練習記録' },
  { to: '/matches', label: '試合' },
  { to: '/stats', label: '統計' },
  { to: '/matchmaker', label: '対戦表' },
  { to: '/wishlist', label: '欲しいもの' },
  { to: '/packing', label: '持ち物' },
  { to: '/data', label: 'データ' },
  { to: '/settings', label: '設定' },
];

const NAV_ORDER_KEY = 'tennis-tracker:nav-order';

// 保存済みの並び順（パスの配列）を正規化する。
// 廃止されたタブは捨て、アプリ側で増えたタブは末尾に足すので、
// 古い保存値でもタブが消えたり重複したりしない。
export function resolveNavOrder(stored: unknown): NavItem[] {
  const paths = Array.isArray(stored) ? stored.filter((p): p is string => typeof p === 'string') : [];
  const byPath = new Map(NAV_ITEMS.map((item) => [item.to, item]));
  const ordered: NavItem[] = [];
  for (const path of paths) {
    const item = byPath.get(path);
    if (item) {
      ordered.push(item);
      byPath.delete(path); // 重複したパスは1つだけ採用
    }
  }
  for (const item of NAV_ITEMS) {
    if (byPath.has(item.to)) ordered.push(item);
  }
  return ordered;
}

export function loadNavOrder(): NavItem[] {
  const raw = localStorage.getItem(NAV_ORDER_KEY);
  if (!raw) return [...NAV_ITEMS];
  try {
    return resolveNavOrder(JSON.parse(raw));
  } catch {
    return [...NAV_ITEMS];
  }
}

export function saveNavOrder(items: NavItem[]): void {
  localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(items.map((item) => item.to)));
}

// 既定の並び順に戻す（保存値を消す）。
export function clearNavOrder(): void {
  localStorage.removeItem(NAV_ORDER_KEY);
}

// 配列の from 番目を to 番目へ移動した新しい配列を返す。
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
