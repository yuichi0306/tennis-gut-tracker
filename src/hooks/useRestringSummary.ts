import { useMemo } from 'react';
import { useRackets } from './useRackets';
import { useStringingRecords } from './useStringingRecords';
import { usePracticeSessions } from './usePracticeSessions';
import { useMatches } from './useMatches';
import { useSettings } from './useSettings';
import { getRestringInfo } from '../lib/restring';
import { activeRackets } from '../lib/racket';

export interface RestringSummary {
  total: number; // 使用中のラケット本数（アーカイブ済みは含まない）
  overdue: number; // 張り替え推奨の本数
  warning: number; // そろそろの本数
  overdueNames: string[]; // 張り替え推奨のラケット名
}

// 全ラケットの張り替え状況を集計する（ダッシュボードのバッジ・通知に使用）。
export function useRestringSummary(): RestringSummary {
  const { rackets } = useRackets();
  const { records } = useStringingRecords();
  const { sessions } = usePracticeSessions();
  const { matches } = useMatches();
  const { settings } = useSettings();

  return useMemo(() => {
    // アーカイブしたラケットは通知・バッジの対象外
    const targets = activeRackets(rackets);
    let overdue = 0;
    let warning = 0;
    const overdueNames: string[] = [];
    for (const r of targets) {
      const info = getRestringInfo(r.id, records, sessions, settings, matches);
      if (info.status === 'overdue') {
        overdue += 1;
        overdueNames.push(r.name);
      } else if (info.status === 'warning') {
        warning += 1;
      }
    }
    return { total: targets.length, overdue, warning, overdueNames };
  }, [rackets, records, sessions, matches, settings]);
}
