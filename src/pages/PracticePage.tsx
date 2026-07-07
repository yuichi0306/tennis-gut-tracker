import { useState } from 'react';
import { useRackets } from '../hooks/useRackets';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import type { PracticeSession, TensionFeel } from '../types';
import { todayISO } from '../lib/date';
import HistoryFilter from '../components/HistoryFilter';
import { TENSION_FEELS, tensionFeelLabel, tensionFeelClass } from '../lib/tensionFeel';

export default function PracticePage() {
  const { rackets } = useRackets();
  const { sessions, addSession, updateSession, deleteSession } = usePracticeSessions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [racketId, setRacketId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [tensionFeel, setTensionFeel] = useState<TensionFeel | ''>('');
  const [notes, setNotes] = useState('');

  const racketName = (id: string) => rackets.find((r) => r.id === id)?.name ?? '(削除済みラケット)';

  function resetForm() {
    setEditingId(null);
    setRacketId('');
    setDate(todayISO());
    setDurationMinutes('60');
    setTensionFeel('');
    setNotes('');
  }

  function startEdit(s: PracticeSession) {
    setEditingId(s.id);
    setRacketId(s.racketId);
    setDate(s.date);
    setDurationMinutes(String(s.durationMinutes));
    setTensionFeel(s.tensionFeel ?? '');
    setNotes(s.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!racketId) return;
    const payload = {
      racketId,
      date,
      durationMinutes: Number(durationMinutes),
      tensionFeel,
      notes: notes.trim(),
    };
    if (editingId) {
      updateSession(editingId, payload);
    } else {
      addSession(payload);
    }
    resetForm();
  }

  // 絞り込み条件
  const [fRacket, setFRacket] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fKeyword, setFKeyword] = useState('');
  const filterActive = !!(fRacket || fFrom || fTo || fKeyword.trim());

  function clearFilters() {
    setFRacket('');
    setFFrom('');
    setFTo('');
    setFKeyword('');
  }

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const kw = fKeyword.trim().toLowerCase();
  const filteredSessions = sortedSessions.filter((s) => {
    if (fRacket && s.racketId !== fRacket) return false;
    if (fFrom && s.date < fFrom) return false;
    if (fTo && s.date > fTo) return false;
    if (kw) {
      const haystack = `${s.notes} ${racketName(s.racketId)}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">{editingId ? '練習記録を編集' : '練習記録を追加'}</h2>
        {rackets.length === 0 ? (
          <p className="text-sm text-gray-500">先に「ラケット」タブでラケットを登録してください。</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              ラケット
              <select value={racketId} onChange={(e) => setRacketId(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5" required>
                <option value="">選択してください</option>
                {rackets.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              日付
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5" required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              練習時間（分）
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} min="1" className="rounded border border-gray-300 px-2 py-1.5" required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              テンション体感（任意）
              <select value={tensionFeel} onChange={(e) => setTensionFeel(e.target.value as TensionFeel | '')} className="rounded border border-gray-300 px-2 py-1.5">
                <option value="">未選択</option>
                {TENSION_FEELS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              メモ
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded border border-gray-300 px-2 py-1.5" />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                {editingId ? '更新する' : '記録する'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  キャンセル
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">練習履歴</h2>
        {sortedSessions.length === 0 ? (
          <p className="text-sm text-gray-500">まだ記録がありません。</p>
        ) : (
          <>
            <HistoryFilter
              rackets={rackets}
              racketId={fRacket}
              onRacketId={setFRacket}
              from={fFrom}
              onFrom={setFFrom}
              to={fTo}
              onTo={setFTo}
              keyword={fKeyword}
              onKeyword={setFKeyword}
              keywordPlaceholder="メモ・ラケット名で検索"
              active={filterActive}
              onClear={clearFilters}
              resultCount={filteredSessions.length}
              totalCount={sortedSessions.length}
            />
            {filteredSessions.length === 0 ? (
              <p className="text-sm text-gray-500">条件に一致する記録がありません。</p>
            ) : (
          <ul className="space-y-2">
            {filteredSessions.map((s) => (
              <li key={s.id} className="rounded border border-gray-200 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s.date} - {racketName(s.racketId)}</p>
                    <p className="flex flex-wrap items-center gap-2">
                      <span>{Math.floor(s.durationMinutes / 60)}時間{s.durationMinutes % 60}分</span>
                      {s.tensionFeel && (
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tensionFeelClass(s.tensionFeel)}`}>
                          {tensionFeelLabel(s.tensionFeel)}
                        </span>
                      )}
                    </p>
                    {s.notes && <p className="text-gray-500">メモ: {s.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(s)} className="text-emerald-700 hover:underline">
                      編集
                    </button>
                    <button onClick={() => deleteSession(s.id)} className="text-red-600 hover:underline">
                      削除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
