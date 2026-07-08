import type { Racket } from '../types';

// 履歴の絞り込みバー（ラケット・期間・キーワード、任意でガット種類）。
interface HistoryFilterProps {
  rackets: Racket[];
  racketId: string;
  onRacketId: (v: string) => void;
  from: string;
  onFrom: (v: string) => void;
  to: string;
  onTo: (v: string) => void;
  keyword: string;
  onKeyword: (v: string) => void;
  keywordPlaceholder?: string;
  // ガット種類フィルタ（張り替え履歴のみ）
  gutTypes?: string[];
  gutType?: string;
  onGutType?: (v: string) => void;
  active: boolean;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
}

const inputClass = 'rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5';

export default function HistoryFilter(props: HistoryFilterProps) {
  const {
    rackets,
    racketId,
    onRacketId,
    from,
    onFrom,
    to,
    onTo,
    keyword,
    onKeyword,
    keywordPlaceholder = 'キーワードで検索',
    gutTypes,
    gutType,
    onGutType,
    active,
    onClear,
    resultCount,
    totalCount,
  } = props;

  return (
    <div className="mb-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          ラケット
          <select value={racketId} onChange={(e) => onRacketId(e.target.value)} className={inputClass}>
            <option value="">すべて</option>
            {rackets.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>

        {gutTypes && onGutType && (
          <label className="flex flex-col gap-1 text-sm">
            ガットの種類
            <select value={gutType ?? ''} onChange={(e) => onGutType(e.target.value)} className={inputClass}>
              <option value="">すべて</option>
              {gutTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          期間（開始）
          <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          期間（終了）
          <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          キーワード
          <input type="text" value={keyword} onChange={(e) => onKeyword(e.target.value)} placeholder={keywordPlaceholder} className={inputClass} />
        </label>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
        <span>{active ? `${resultCount} / ${totalCount} 件を表示` : `全 ${totalCount} 件`}</span>
        {active && (
          <button onClick={onClear} className="text-emerald-700 dark:text-emerald-400 hover:underline">
            絞り込みをクリア
          </button>
        )}
      </div>
    </div>
  );
}
