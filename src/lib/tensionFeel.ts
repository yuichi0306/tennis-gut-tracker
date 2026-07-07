import type { TensionFeel } from '../types';

// テンション体感の選択肢とラベル・色。
export const TENSION_FEELS: { value: TensionFeel; label: string; className: string }[] = [
  { value: 'tight', label: 'かたい（張りたて）', className: 'bg-emerald-100 text-emerald-700' },
  { value: 'ok', label: 'ちょうどいい', className: 'bg-sky-100 text-sky-700' },
  { value: 'loose', label: 'ゆるい（へたり）', className: 'bg-amber-100 text-amber-700' },
];

export function tensionFeelLabel(value: TensionFeel | '' | undefined): string | null {
  if (!value) return null;
  return TENSION_FEELS.find((f) => f.value === value)?.label ?? null;
}

export function tensionFeelClass(value: TensionFeel | '' | undefined): string {
  return TENSION_FEELS.find((f) => f.value === value)?.className ?? 'bg-gray-100 text-gray-600';
}
