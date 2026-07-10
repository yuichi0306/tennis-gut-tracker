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
  gutPrice?: number; // ガット代（円）
  stringingFee?: number; // 張り代・工賃（円）
  rating?: number; // 打感の評価（★1〜5、未評価は 0 または未設定）
  notes: string;
}

// ガットのテンション体感（張りたて→へたり）
export type TensionFeel = 'tight' | 'ok' | 'loose';

// テニスシューズの対応コート（サーフェス）
export type ShoeSurface = 'オールコート' | 'オムニ・クレー' | 'ハード' | 'クレー' | 'カーペット';

// テニスシューズ。任意項目は未入力を ''／0 で表す（Firestore は undefined を保存できない）。
export interface Shoe {
  id: string;
  name: string; // 例: アシックス ゲルレゾリューション 9
  purchaseDate: string; // 購入日（ISO date。未入力は ''）
  price: number; // 購入価格（円。未入力は 0）
  surface: ShoeSurface | ''; // 対応コート（未選択は ''）
  notes: string;
  createdAt: string; // ISO datetime
}

// 練習記録
export interface PracticeSession {
  id: string;
  racketId: string;
  shoeId?: string; // 履いたシューズ（未選択は ''）
  date: string; // ISO date
  durationMinutes: number;
  tensionFeel?: TensionFeel | ''; // その日のテンション体感（任意）
  notes: string;
}

// ガット種類ごとの張り替え推奨ライン（overdue）。判定は使用時間または経過日数で行う。
export interface GutThreshold {
  hours: number; // 使用時間の推奨ライン
  days: number; // 経過日数の推奨ライン
}

// 張り替え推奨の設定。ガット種類ごとに基準を持ち、「そろそろ」は推奨の80%で判定する。
// シューズの買い替え基準（使用時間）も同じ設定に持つ。
export interface RestringSettings {
  thresholds: Record<GutType, GutThreshold>;
  shoeHours: number; // シューズの買い替え推奨ライン（使用時間）
}

// 対戦表の参加者名簿
export interface RosterPlayer {
  id: string;
  name: string;
}
