import type { Racket, StringingRecord, PracticeSession, RestringSettings, RosterPlayer, Shoe } from '../types';
import { racketStorage, shoeStorage, stringingStorage, practiceStorage, settingsStorage, rosterStorage, syncMeta } from './storage';
import { resolveSettings } from './settings';
import { recordCost } from './cost';
import { tensionFeelLabel } from './tensionFeel';

export interface BackupData {
  app: 'tennis-gut-tracker';
  version: 1;
  exportedAt: string; // ISO datetime
  rackets: Racket[];
  stringingRecords: StringingRecord[];
  practiceSessions: PracticeSession[];
  settings?: RestringSettings;
  roster?: RosterPlayer[];
  shoes?: Shoe[]; // シューズ対応より前のバックアップには含まれない
}

// 現在の全データをバックアップ用オブジェクトにまとめる
export function buildBackup(): BackupData {
  return {
    app: 'tennis-gut-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    rackets: racketStorage.getAll(),
    stringingRecords: stringingStorage.getAll(),
    practiceSessions: practiceStorage.getAll(),
    settings: settingsStorage.get(),
    roster: rosterStorage.getAll(),
    shoes: shoeStorage.getAll(),
  };
}

// テキストをファイルとしてダウンロードさせる共通処理
function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// バックアップJSONをファイルとしてダウンロードさせる
export function downloadBackup() {
  const data = buildBackup();
  const json = JSON.stringify(data, null, 2);
  const date = data.exportedAt.slice(0, 10);
  downloadText(`tennis-gut-tracker-backup-${date}.json`, json, 'application/json');
}

// CSVの1セルをエスケープする（カンマ・改行・引用符を含む場合は "" で囲む）
function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ヘッダー＋行データを CSV 文字列にする。Excel(日本語)対策でBOMを付ける。
function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((cols) => cols.map(csvEscape).join(','));
  const bom = String.fromCharCode(0xfeff); // 先頭のBOMでExcelが日本語を正しく読む
  return bom + lines.join('\r\n');
}

// ラケットidから名前を引く関数を作る
function racketNamer() {
  const rackets = racketStorage.getAll();
  return (id: string) => rackets.find((r) => r.id === id)?.name ?? '(削除済みラケット)';
}

// シューズidから名前を引く関数を作る（未選択は空欄）
function shoeNamer() {
  const shoes = shoeStorage.getAll();
  return (id: string | undefined) => {
    if (!id) return '';
    return shoes.find((s) => s.id === id)?.name ?? '(削除済みシューズ)';
  };
}

// 張り替え記録をCSVで書き出す
export function downloadStringingCsv() {
  const nameOf = racketNamer();
  const records = [...stringingStorage.getAll()].sort((a, b) => a.date.localeCompare(b.date));
  const headers = [
    '日付', 'ラケット', 'ガット名', '種類', 'メインテンション(lbs)', 'クロステンション(lbs)',
    '張り場所', 'ガット代(円)', '張り代(円)', '合計費用(円)', '打感(★1-5)', 'メモ',
  ];
  const rows = records.map((r) => [
    r.date, nameOf(r.racketId), r.gutName, r.gutType, r.mainTension, r.crossTension,
    r.shop, r.gutPrice ?? 0, r.stringingFee ?? 0, recordCost(r), r.rating ?? '', r.notes,
  ]);
  const date = new Date().toISOString().slice(0, 10);
  downloadText(`tennis-gut-tracker-stringing-${date}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8');
}

// 練習記録をCSVで書き出す
export function downloadPracticeCsv() {
  const nameOf = racketNamer();
  const shoeNameOf = shoeNamer();
  const sessions = [...practiceStorage.getAll()].sort((a, b) => a.date.localeCompare(b.date));
  const headers = ['日付', 'ラケット', 'シューズ', '練習時間(分)', 'テンション体感', 'メモ'];
  const rows = sessions.map((s) => [
    s.date, nameOf(s.racketId), shoeNameOf(s.shoeId), s.durationMinutes, tensionFeelLabel(s.tensionFeel) ?? '', s.notes,
  ]);
  const date = new Date().toISOString().slice(0, 10);
  downloadText(`tennis-gut-tracker-practice-${date}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8');
}

export interface ImportResult {
  rackets: number;
  stringingRecords: number;
  practiceSessions: number;
  shoes: number;
}

// 配列であり、各要素にidを持つことを最低限チェックする
function asRecordArray<T extends { id: string }>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'string') as T[];
}

// バックアップJSON文字列を検証して読み込む。成功時は保存し件数を返す。
// 失敗時は Error を投げる。
export function importBackup(jsonText: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('ファイルの形式が不正です（JSONとして読み込めませんでした）。');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('バックアップファイルの中身が不正です。');
  }
  const obj = parsed as Partial<BackupData>;
  if (obj.app !== 'tennis-gut-tracker') {
    throw new Error('このアプリのバックアップファイルではないようです。');
  }

  const rackets = asRecordArray<Racket>(obj.rackets);
  const stringingRecords = asRecordArray<StringingRecord>(obj.stringingRecords);
  const practiceSessions = asRecordArray<PracticeSession>(obj.practiceSessions);
  const roster = asRecordArray<RosterPlayer>(obj.roster);
  const shoes = asRecordArray<Shoe>(obj.shoes);

  racketStorage.save(rackets);
  stringingStorage.save(stringingRecords);
  practiceStorage.save(practiceSessions);
  rosterStorage.save(roster);
  shoeStorage.save(shoes);

  // 設定は任意項目。含まれていれば正規化して取り込む（不正値は既定値で補完）
  if (obj.settings && typeof obj.settings === 'object') {
    settingsStorage.save(resolveSettings(obj.settings));
  }

  // 復元は「置き換え」。ログイン中でもクラウドを結合せず、この内容で上書きさせる。
  syncMeta.setPendingReplace();

  return {
    rackets: rackets.length,
    stringingRecords: stringingRecords.length,
    practiceSessions: practiceSessions.length,
    shoes: shoes.length,
  };
}
