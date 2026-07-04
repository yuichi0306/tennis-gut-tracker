// ラケット
export interface Racket {
  id: string;
  name: string; // 例: Wilson Blade 98 v8
  createdAt: string; // ISO date
}

// ガットの種類
export type GutType = 'ポリエステル' | 'ナイロン（合成繊維）' | 'ナチュラル' | 'ハイブリッド';

// ガット張り替え記録
export interface StringingRecord {
  id: string;
  racketId: string;
  date: string; // ISO date（張り替え日）
  gutName: string; // 例: Luxilon ALU Power
  gutType: GutType;
  mainTension: number; // タテ糸テンション(lbs)
  crossTension: number; // ヨコ糸テンション(lbs)
  shop: string; // 張った場所（自分/ショップ名）
  notes: string;
}

// 練習記録
export interface PracticeSession {
  id: string;
  racketId: string;
  date: string; // ISO date
  durationMinutes: number;
  notes: string;
}

// ガット種類ごとの張り替え推奨ライン（overdue）。判定は使用時間または経過日数で行う。
export interface GutThreshold {
  hours: number; // 使用時間の推奨ライン
  days: number; // 経過日数の推奨ライン
}

// 張り替え推奨の設定。ガット種類ごとに基準を持ち、「そろそろ」は推奨の80%で判定する。
export interface RestringSettings {
  thresholds: Record<GutType, GutThreshold>;
}
