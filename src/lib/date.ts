// 日付ユーティリティ。localStorage には YYYY-MM-DD（ローカルタイムゾーン基準）で保存する。

// 今日の日付を YYYY-MM-DD で返す（ローカルタイムゾーン基準）。
// new Date().toISOString() はUTCのため、日本時間の深夜〜朝9時に前日になってしまう。
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// YYYY-MM-DD をローカルタイムゾーンの0時として Date に変換する。
// new Date('YYYY-MM-DD') はUTCの0時と解釈され、日本では9時間ズレるため使わない。
export function parseISODateLocal(dateISO: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d);
}
