import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { FREQUENCY_PRESETS } from '../lib/settings';
import type { PlayFrequency, RestringSettings } from '../types';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState<RestringSettings>(settings);
  const [saved, setSaved] = useState(false);

  // プレイ頻度を選ぶと推奨日数をプリセットで上書き
  function handleFrequency(freq: PlayFrequency) {
    if (freq === 'custom') {
      setDraft({ ...draft, frequency: 'custom' });
    } else {
      const preset = FREQUENCY_PRESETS[freq];
      setDraft({ frequency: freq, warningDays: preset.warningDays, overdueDays: preset.overdueDays });
    }
    setSaved(false);
  }

  // 日数を手動で変えたら「カスタム」扱いにする
  function handleDays(field: 'warningDays' | 'overdueDays', value: string) {
    setDraft({ ...draft, frequency: 'custom', [field]: Number(value) });
    setSaved(false);
  }

  const invalid = draft.warningDays < 1 || draft.overdueDays < 1 || draft.warningDays >= draft.overdueDays;

  function handleSave() {
    if (invalid) return;
    updateSettings(draft);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-1 text-xl font-bold">張り替え推奨の設定</h2>
        <p className="mb-4 text-sm text-gray-600">
          最後の張り替えからの経過日数で「そろそろ」「推奨」を判定します。プレイ頻度を選ぶと目安が自動で入り、日数を直接調整することもできます。
        </p>

        <div className="space-y-4 rounded border border-gray-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm">
            プレイ頻度
            <select
              value={draft.frequency}
              onChange={(e) => handleFrequency(e.target.value as PlayFrequency)}
              className="rounded border border-gray-300 px-2 py-1.5"
            >
              {(Object.keys(FREQUENCY_PRESETS) as (keyof typeof FREQUENCY_PRESETS)[]).map((key) => (
                <option key={key} value={key}>
                  {FREQUENCY_PRESETS[key].label}（{FREQUENCY_PRESETS[key].warningDays}日 / {FREQUENCY_PRESETS[key].overdueDays}日）
                </option>
              ))}
              <option value="custom">カスタム</option>
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              「そろそろ」と表示する日数
              <input
                type="number"
                min="1"
                value={draft.warningDays}
                onChange={(e) => handleDays('warningDays', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              「推奨」と表示する日数
              <input
                type="number"
                min="1"
                value={draft.overdueDays}
                onChange={(e) => handleDays('overdueDays', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5"
              />
            </label>
          </div>

          {invalid && (
            <p className="text-sm text-red-600">
              「推奨」の日数は「そろそろ」より大きく、どちらも1以上にしてください。
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={invalid}
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              保存する
            </button>
            {saved && <span className="text-sm text-emerald-700">保存しました。</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
