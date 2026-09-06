import type { Racket } from '../types';

// 購入日(purchaseDate)を足す前に保存されたラケットには、この項目が無い。
// 読み込み時に '' で補完して、以降のコードでは常に文字列として扱えるようにする。
// （Firestore は undefined を保存できないので、未入力は '' で持つ）
export function normalizeRacket(r: Racket): Racket {
  return { ...r, purchaseDate: typeof r.purchaseDate === 'string' ? r.purchaseDate : '' };
}
