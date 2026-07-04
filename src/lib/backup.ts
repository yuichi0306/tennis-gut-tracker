import type { Racket, StringingRecord, PracticeSession, RestringSettings } from '../types';
import { racketStorage, stringingStorage, practiceStorage, settingsStorage } from './storage';

export interface BackupData {
  app: 'tennis-gut-tracker';
  version: 1;
  exportedAt: string; // ISO datetime
  rackets: Racket[];
  stringingRecords: StringingRecord[];
  practiceSessions: PracticeSession[];
  settings?: RestringSettings;
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
  };
}

// バックアップJSONをファイルとしてダウンロードさせる
export function downloadBackup() {
  const data = buildBackup();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = data.exportedAt.slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tennis-gut-tracker-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  rackets: number;
  stringingRecords: number;
  practiceSessions: number;
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

  racketStorage.save(rackets);
  stringingStorage.save(stringingRecords);
  practiceStorage.save(practiceSessions);

  // 設定は任意項目。含まれていれば数値の妥当性を確認して取り込む
  const s = obj.settings;
  if (s && typeof s.warningDays === 'number' && typeof s.overdueDays === 'number' && s.warningDays >= 1 && s.overdueDays > s.warningDays) {
    settingsStorage.save({ frequency: s.frequency ?? 'custom', warningDays: s.warningDays, overdueDays: s.overdueDays });
  }

  return {
    rackets: rackets.length,
    stringingRecords: stringingRecords.length,
    practiceSessions: practiceSessions.length,
  };
}
