// 持ち物リストのカテゴリ・定番プリセット・旧データの移行。
// リストは用途ごとに複数持てる（合宿・試合・日帰り練習…）。

import type { PackingItem, PackingList } from '../types';

// カテゴリの表示順（プリセット・並び替えの基準）
export const PACKING_CATEGORIES = ['テニス用品', 'ウェア', 'ケア・補給', '洗面・お風呂', '着替え', '書類・お金', 'その他'] as const;

export interface PresetItem {
  name: string;
  category: string;
  quantity: number;
}

export interface PackingPreset {
  key: string;
  name: string; // 新しく作るリストの既定の名前
  description: string; // 選ぶときの説明
  items: PresetItem[];
}

// テニス合宿の定番（泊まり）
const CAMP_ITEMS: PresetItem[] = [
  { category: 'テニス用品', name: 'ラケット', quantity: 2 },
  { category: 'テニス用品', name: 'テニスシューズ', quantity: 1 },
  { category: 'テニス用品', name: '替えガット', quantity: 2 },
  { category: 'テニス用品', name: 'グリップテープ', quantity: 2 },
  { category: 'テニス用品', name: 'ボール', quantity: 1 },
  { category: 'テニス用品', name: '帽子・サンバイザー', quantity: 1 },
  { category: 'テニス用品', name: 'サングラス', quantity: 1 },

  { category: 'ウェア', name: 'テニスウェア（上）', quantity: 3 },
  { category: 'ウェア', name: 'テニスウェア（下）', quantity: 3 },
  { category: 'ウェア', name: 'ソックス', quantity: 4 },
  { category: 'ウェア', name: 'アンダーウェア', quantity: 2 },
  { category: 'ウェア', name: 'ウィンドブレーカー', quantity: 1 },

  { category: '洗面・お風呂', name: 'タオル', quantity: 3 },
  { category: '洗面・お風呂', name: '歯ブラシ・歯みがき', quantity: 1 },
  { category: '洗面・お風呂', name: 'シャンプー・ボディソープ', quantity: 1 },
  { category: '洗面・お風呂', name: '日焼け止め', quantity: 1 },

  { category: '着替え', name: '普段着', quantity: 2 },
  { category: '着替え', name: '下着', quantity: 3 },
  { category: '着替え', name: 'パジャマ・部屋着', quantity: 1 },

  { category: '書類・お金', name: '財布・現金', quantity: 1 },
  { category: '書類・お金', name: '保険証', quantity: 1 },
  { category: '書類・お金', name: 'スマホ充電器', quantity: 1 },

  { category: 'その他', name: '常備薬', quantity: 1 },
  { category: 'その他', name: '飲み物・補給食', quantity: 1 },
  { category: 'その他', name: 'ビニール袋（洗濯物用）', quantity: 2 },
];

// 試合の定番（日帰りの大会・試合）
const MATCH_ITEMS: PresetItem[] = [
  { category: 'テニス用品', name: 'ラケット', quantity: 2 },
  { category: 'テニス用品', name: 'テニスシューズ', quantity: 1 },
  { category: 'テニス用品', name: '替えガット', quantity: 2 },
  { category: 'テニス用品', name: 'グリップテープ', quantity: 2 },
  { category: 'テニス用品', name: 'ボール', quantity: 1 },
  { category: 'テニス用品', name: '帽子・サンバイザー', quantity: 1 },
  { category: 'テニス用品', name: 'サングラス', quantity: 1 },

  { category: 'ウェア', name: 'テニスウェア（上）', quantity: 2 },
  { category: 'ウェア', name: 'テニスウェア（下）', quantity: 2 },
  { category: 'ウェア', name: 'ソックス', quantity: 2 },
  { category: 'ウェア', name: 'アンダーウェア', quantity: 1 },
  { category: 'ウェア', name: 'ウィンドブレーカー', quantity: 1 },

  { category: 'ケア・補給', name: 'ドリンク', quantity: 2 },
  { category: 'ケア・補給', name: '補給食（ゼリー・バナナ等）', quantity: 1 },
  { category: 'ケア・補給', name: 'テーピング', quantity: 1 },
  { category: 'ケア・補給', name: '冷却剤・アイシング', quantity: 1 },
  { category: 'ケア・補給', name: '常備薬', quantity: 1 },
  { category: 'ケア・補給', name: '日焼け止め', quantity: 1 },

  { category: '洗面・お風呂', name: 'タオル', quantity: 2 },

  { category: '着替え', name: '着替え（試合後）', quantity: 1 },

  { category: '書類・お金', name: '財布・現金', quantity: 1 },
  { category: '書類・お金', name: '保険証', quantity: 1 },
  { category: '書類・お金', name: 'エントリー書類・大会要項', quantity: 1 },
  { category: '書類・お金', name: 'スマホ充電器', quantity: 1 },

  { category: 'その他', name: '雨具・折りたたみ傘', quantity: 1 },
  { category: 'その他', name: 'ビニール袋', quantity: 1 },
];

// 日帰り練習の定番（最小限）
const PRACTICE_ITEMS: PresetItem[] = [
  { category: 'テニス用品', name: 'ラケット', quantity: 2 },
  { category: 'テニス用品', name: 'テニスシューズ', quantity: 1 },
  { category: 'テニス用品', name: 'グリップテープ', quantity: 1 },
  { category: 'テニス用品', name: 'ボール', quantity: 1 },
  { category: 'テニス用品', name: '帽子・サンバイザー', quantity: 1 },

  { category: 'ウェア', name: 'テニスウェア（上）', quantity: 1 },
  { category: 'ウェア', name: 'テニスウェア（下）', quantity: 1 },
  { category: 'ウェア', name: 'ソックス', quantity: 1 },
  { category: 'ウェア', name: 'ウィンドブレーカー', quantity: 1 },

  { category: 'ケア・補給', name: 'ドリンク', quantity: 1 },
  { category: 'ケア・補給', name: '補給食', quantity: 1 },

  { category: '洗面・お風呂', name: 'タオル', quantity: 1 },

  { category: '書類・お金', name: '財布・現金', quantity: 1 },
  { category: '書類・お金', name: 'スマホ充電器', quantity: 1 },
];

export const PACKING_PRESETS: PackingPreset[] = [
  { key: 'camp', name: '合宿', description: '泊まりの合宿。着替え・洗面用具まで含む25項目', items: CAMP_ITEMS },
  { key: 'match', name: '試合', description: '日帰りの試合。補給・ケア・書類を含む26項目', items: MATCH_ITEMS },
  { key: 'practice', name: '日帰り練習', description: 'いつもの練習。最小限の14項目', items: PRACTICE_ITEMS },
];

// 複数リスト対応より前のデータを移行するとき、受け皿にする「合宿」リストの固定ID。
// 固定にしておかないと、端末ごとに別IDのリストができて同期で二重になる。
export const LEGACY_LIST_ID = 'legacy-camp';
const LEGACY_LIST_NAME = '合宿';

// 読み込んだリスト・持ち物を、複数リスト対応の形にそろえる。
// listId を持たない昔の持ち物は、固定IDの「合宿」リストにまとめて入れる。
export function migratePacking(
  lists: PackingList[],
  items: PackingItem[],
): { lists: PackingList[]; items: PackingItem[] } {
  const legacyItems = items.filter((i) => !i.listId);
  if (legacyItems.length === 0) return { lists, items };

  const migratedItems = items.map((i) => (i.listId ? i : { ...i, listId: LEGACY_LIST_ID }));
  const hasLegacyList = lists.some((l) => l.id === LEGACY_LIST_ID);
  const migratedLists = hasLegacyList
    ? lists
    : [{ id: LEGACY_LIST_ID, name: LEGACY_LIST_NAME, createdAt: new Date(0).toISOString() }, ...lists];
  return { lists: migratedLists, items: migratedItems };
}

// リストは作った順に並べる（createdAt が同じなら名前順）
export function sortedPackingLists(lists: PackingList[]): PackingList[] {
  return [...lists].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
}
