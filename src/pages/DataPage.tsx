import { useRef, useState } from 'react';
import { downloadBackup, downloadStringingCsv, downloadPracticeCsv, importBackup, type ImportResult } from '../lib/backup';

export default function DataPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  function handleExport() {
    downloadBackup();
    setMessage({ type: 'ok', text: 'バックアップファイルをダウンロードしました。' });
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 同じファイルを続けて選べるように input はリセットしておく
    e.target.value = '';
    if (!file) return;

    if (!confirm('現在のデータはすべて上書きされます。よろしいですか？')) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result: ImportResult = importBackup(String(reader.result));
        setMessage({
          type: 'ok',
          text: `復元しました（ラケット${result.rackets}件・張り替え${result.stringingRecords}件・練習${result.practiceSessions}件）。画面を再読み込みします…`,
        });
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : '読み込みに失敗しました。' });
      }
    };
    reader.onerror = () => setMessage({ type: 'error', text: 'ファイルの読み込みに失敗しました。' });
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">データのバックアップ</h2>
        <p className="mb-3 text-sm text-gray-600">
          記録はこの端末のブラウザ内に保存されています。機種変更やブラウザのデータ削除に備えて、ファイルに書き出して保管できます。
        </p>
        <button
          onClick={handleExport}
          className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          バックアップを書き出す
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">CSVで書き出す</h2>
        <p className="mb-3 text-sm text-gray-600">
          記録をCSVファイルで書き出せます。Excelやスプレッドシートで開いて自由に集計・保管できます。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { downloadStringingCsv(); setMessage({ type: 'ok', text: '張り替え記録をCSVで書き出しました。' }); }}
            className="rounded border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            張り替え記録CSV
          </button>
          <button
            onClick={() => { downloadPracticeCsv(); setMessage({ type: 'ok', text: '練習記録をCSVで書き出しました。' }); }}
            className="rounded border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            練習記録CSV
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">データの復元</h2>
        <p className="mb-3 text-sm text-gray-600">
          書き出したバックアップファイル（.json）を選ぶと、現在のデータを<strong>すべて置き換え</strong>ます。
        </p>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileSelected} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          バックアップから復元する
        </button>
      </section>

      {message && (
        <p className={`text-sm ${message.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>
      )}
    </div>
  );
}
