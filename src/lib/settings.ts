import type { GutType, GutThreshold, RestringSettings } from '../types';

// 「そろそろ」表示は推奨ラインの何割か
export const WARNING_RATIO = 0.8;

// 設定画面などで使うガット種類の一覧（表示順）
export const GUT_TYPES: GutType[] = ['ポリエステル', 'ナイロン（合成繊維）', 'ナチュラル', 'ハイブリッド'];

// ガット種類ごとの推奨ライン（使用時間・経過日数）の既定値
// ポリ: 20時間/約2.5ヶ月、ナイロン: 40時間/約5ヶ月。
// ナチュラルはナイロン相当、ハイブリッドはポリ相当（メインにポリを使うことが多いため）。
export const DEFAULT_THRESHOLDS: Record<GutType, GutThreshold> = {
  'ポリエステル': { hours: 20, days: 75 },
  'ナイロン（合成繊維）': { hours: 40, days: 150 },
  'ナチュラル': { hours: 40, days: 150 },
  'ハイブリッド': { hours: 20, days: 75 },
};

export const DEFAULT_SETTINGS: RestringSettings = {
  thresholds: DEFAULT_THRESHOLDS,
};

// 保存済みの（部分的・不正かもしれない）設定を既定値へマージして正規化する。
// 数値でない・0以下の値は既定値で補う。常に新しいオブジェクトを返す。
export function resolveSettings(stored: Partial<RestringSettings> | null | undefined): RestringSettings {
  const thresholds = {} as Record<GutType, GutThreshold>;
  for (const t of GUT_TYPES) {
    const def = DEFAULT_THRESHOLDS[t];
    const s = stored?.thresholds?.[t];
    const hours = s && Number.isFinite(s.hours) && s.hours > 0 ? s.hours : def.hours;
    const days = s && Number.isFinite(s.days) && s.days > 0 ? s.days : def.days;
    thresholds[t] = { hours, days };
  }
  return { thresholds };
}
