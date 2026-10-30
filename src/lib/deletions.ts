// 同期用の「削除済み」記録。端末とクラウドを id で結合しても、
// 別の端末で消した項目が古いデータから復活しないようにする。
import type { Deletion, DeletionKind } from '../types';

export function normalizeDeletions(raw: unknown): Deletion[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((d) => d && typeof d.kind === 'string' && typeof d.id === 'string' && typeof d.at === 'number');
}

export function deletionKey(kind: DeletionKind, id: string): string {
  return `${kind}:${id}`;
}

// 変更前後の id を比べ、消えた id を記録し、再び現れた id の記録を外す。変化が無ければ同じ配列を返す。
export function noteDeletions(deletions: Deletion[], kind: DeletionKind, prevIds: string[], nextIds: string[], now: number): Deletion[] {
  const next = new Set(nextIds);
  const known = new Set(deletions.filter((d) => d.kind === kind).map((d) => d.id));
  const removed = prevIds.filter((id) => !next.has(id) && !known.has(id));
  const revived = nextIds.some((id) => known.has(id));
  if (removed.length === 0 && !revived) return deletions;
  return [
    ...deletions.filter((d) => d.kind !== kind || !next.has(d.id)),
    ...removed.map((id) => ({ kind, id, at: now })),
  ];
}

// 2つの記録を合わせる（同じ項目は新しいほうの時刻を残す）
export function mergeDeletions(a: Deletion[], b: Deletion[]): Deletion[] {
  const map = new Map<string, Deletion>();
  for (const d of [...a, ...b]) {
    const key = deletionKey(d.kind, d.id);
    const cur = map.get(key);
    if (!cur || cur.at < d.at) map.set(key, d);
  }
  return [...map.values()];
}
