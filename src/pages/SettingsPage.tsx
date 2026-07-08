import { useEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { GUT_TYPES, DEFAULT_THRESHOLDS, WARNING_RATIO, resolveSettings } from '../lib/settings';
import type { GutType, RestringSettings } from '../types';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState<RestringSettings>(settings);
  const [saved, setSaved] = useState(false);

  // 保存済み設定が非同期で読み込まれたら下書きへ反映
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  function handleChange(gut: GutType, field: 'hours' | 'days', value: string) {
    setDraft((prev) => ({
      thresholds: {
        ...prev.thresholds,
        [gut]: { ...prev.thresholds[gut], [field]: Number(value) },
      },
    }));
    setSaved(false);
  }

  const invalid = GUT_TYPES.some((t) => {
    const th = draft.thresholds[t];
    return !th || th.hours < 1 || th.days < 1;
  });

  function handleSave() {
    if (invalid) return;
    updateSettings(resolveSettings(draft));
    setSaved(true);
  }

  function handleReset() {
    setDraft(resolveSettings(null));
    setSaved(false);
  }

  const warningPct = Math.round(WARNING_RATIO * 100);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-1 text-xl font-bold">張り替え推奨の設定</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
          ガットの種類ごとに「使用時間」と「経過日数」の推奨ラインを設定できます。
          どちらかが基準に達すると<strong>「張り替え推奨」</strong>、基準の{warningPct}%に達すると
          <strong>「そろそろ」</strong>と表示します。
        </p>

        <div className="space-y-3">
          {GUT_TYPES.map((gut) => {
            const th = draft.thresholds[gut];
            const def = DEFAULT_THRESHOLDS[gut];
            return (
              <div key={gut} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4">
                <p className="mb-2 font-semibold">{gut}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    使用時間の基準（時間）
                    <input
                      type="number"
                      min="1"
                      value={th?.hours ?? ''}
                      onChange={(e) => handleChange(gut, 'hours', e.target.value)}
                      className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    経過日数の基準（日）
                    <input
                      type="number"
                      min="1"
                      value={th?.days ?? ''}
                      onChange={(e) => handleChange(gut, 'days', e.target.value)}
                      className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5"
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                  既定: {def.hours}時間 / {def.days}日（約{Math.round((def.days / 30) * 10) / 10}ヶ月）
                </p>
              </div>
            );
          })}
        </div>

        {invalid && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">各項目は1以上の数値を入力してください。</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={invalid}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            保存する
          </button>
          <button onClick={handleReset} className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
            既定値に戻す
          </button>
          {saved && <span className="text-sm text-emerald-700 dark:text-emerald-400">保存しました。</span>}
        </div>
      </section>
    </div>
  );
}
