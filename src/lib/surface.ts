import type { CourtSurface } from '../types';

// 練習・試合の記録で選べるコートのサーフェス。
// シューズの「対応コート」(SHOE_SURFACES @ lib/shoe.ts) とは目的が違うので別に持つ。
// あちらは「そのシューズがどのコート向きか」、こちらは「その日どのコートでプレーしたか」。
export const COURT_SURFACES: CourtSurface[] = ['ハード', 'オムニ', 'クレー', 'カーペット'];
