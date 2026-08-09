import type { WishItem, WishPriority } from '../types';

// 優先度の並び順（高いほど先頭）
const ORDER: Record<WishPriority, number> = { high: 0, mid: 1, low: 2 };

export const WISH_PRIORITIES: { value: WishPriority; label: string; className: string }[] = [
  { value: 'high', label: '高', className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' },
  { value: 'mid', label: '中', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  { value: 'low', label: '低', className: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300' },
];

export function priorityLabel(p: WishPriority): string {
  return WISH_PRIORITIES.find((x) => x.value === p)?.label ?? '中';
}

export function priorityClass(p: WishPriority): string {
  return WISH_PRIORITIES.find((x) => x.value === p)?.className ?? WISH_PRIORITIES[1].className;
}

// 優先度→作成日時の順に並べる（購入済みは考慮しない。呼び出し側でフィルタ）。
export function sortWishes(items: WishItem[]): WishItem[] {
  return [...items].sort((a, b) => ORDER[a.priority] - ORDER[b.priority] || a.createdAt.localeCompare(b.createdAt));
}
