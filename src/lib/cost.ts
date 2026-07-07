import type { StringingRecord } from '../types';

// 1回の張り替えにかかった費用（ガット代＋張り代）。未入力は0扱い。
export function recordCost(r: Pick<StringingRecord, 'gutPrice' | 'stringingFee'>): number {
  return (r.gutPrice ?? 0) + (r.stringingFee ?? 0);
}

// 金額を「¥1,500」形式にする。
export function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}
