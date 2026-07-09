// 対戦表の参加者名簿。この端末の localStorage にのみ保存する（同期はしない）。

export interface RosterPlayer {
  id: string;
  name: string;
}

const ROSTER_KEY = 'tennis-tracker:roster';

export function loadRoster(): RosterPlayer[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (p): p is RosterPlayer => p && typeof p.id === 'string' && typeof p.name === 'string',
    );
  } catch {
    return [];
  }
}

export function saveRoster(players: RosterPlayer[]): void {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(players));
}
