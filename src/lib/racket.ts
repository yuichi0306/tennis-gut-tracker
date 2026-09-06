import type { Racket } from '../types';

// 購入日(purchaseDate)・アーカイブ(archived)を足す前に保存されたラケットには、これらの項目が無い。
// 読み込み時に補完して、以降のコードでは常に文字列・真偽値として扱えるようにする。
// （Firestore は undefined を保存できないので、未入力は '' / false で持つ）
export function normalizeRacket(r: Racket): Racket {
  return {
    ...r,
    purchaseDate: typeof r.purchaseDate === 'string' ? r.purchaseDate : '',
    archived: r.archived === true,
  };
}

// 使用中のラケット（アーカイブしていないもの）だけを返す。
// 記録の入力欄・ダッシュボード・通知はこちらを使う。
export function activeRackets(rackets: Racket[]): Racket[] {
  return rackets.filter((r) => !r.archived);
}

// 入力欄の選択肢に出す予備のラベル。
// アーカイブ済み・削除済みのラケットを選んでいた記録を編集したとき、選択が消えないようにする。
export function pastRacketLabel(rackets: Racket[], id: string): string {
  const racket = rackets.find((r) => r.id === id);
  return racket ? `${racket.name}（アーカイブ済み）` : '(削除済みラケット)';
}
