import type { PlayFrequency, RestringSettings } from '../types';

// プレイ頻度ごとの推奨タイミング（経過日数）プリセット
export const FREQUENCY_PRESETS: Record<
  Exclude<PlayFrequency, 'custom'>,
  { label: string; warningDays: number; overdueDays: number }
> = {
  light: { label: '週1回以下', warningDays: 120, overdueDays: 150 },
  standard: { label: '週2〜3回', warningDays: 90, overdueDays: 120 },
  heavy: { label: '週4回以上', warningDays: 60, overdueDays: 90 },
};

export const DEFAULT_SETTINGS: RestringSettings = {
  frequency: 'standard',
  warningDays: FREQUENCY_PRESETS.standard.warningDays,
  overdueDays: FREQUENCY_PRESETS.standard.overdueDays,
};
