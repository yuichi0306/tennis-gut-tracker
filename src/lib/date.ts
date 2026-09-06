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

// 購入日などからの経過を「◯年◯ヶ月」で返す。1ヶ月未満は「◯日」。
// 未入力（''）や未来の日付なら null を返す。
export function elapsedLabel(dateISO: string, today: string = todayISO()): string | null {
  if (!dateISO) return null;
  const from = parseISODateLocal(dateISO);
  const now = parseISODateLocal(today);
  if (Number.isNaN(from.getTime()) || from.getTime() > now.getTime()) return null;

  // 月数は「日にちが来ていなければ1ヶ月引く」で数える（例: 1/31→2/28 は0ヶ月）
  let months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
  if (now.getDate() < from.getDate()) months -= 1;
  if (months < 1) {
    const days = Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return `${days}日`;
  }
  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  if (years === 0) return `${restMonths}ヶ月`;
  return restMonths === 0 ? `${years}年` : `${years}年${restMonths}ヶ月`;
}

// YYYY-MM-DD に日数を足した YYYY-MM-DD を返す（マイナスも可）。月またぎは Date に任せる。
export function addDaysISO(dateISO: string, days: number): string {
  const d = parseISODateLocal(dateISO);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
