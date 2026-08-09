// 合宿持ち物リストのカテゴリと定番プリセット。

// カテゴリの表示順（プリセット・並び替えの基準）
export const PACKING_CATEGORIES = ['テニス用品', 'ウェア', '洗面・お風呂', '着替え', '書類・お金', 'その他'] as const;

export interface PresetItem {
  name: string;
  category: string;
  quantity: number;
}

// テニス合宿の定番プリセット（不要なものは各自削除して使う想定）
export const PACKING_PRESET: PresetItem[] = [
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
