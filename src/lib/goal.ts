// 目標管理（目標と現在地・課題リスト・月ごとの振り返り）の既定値と並び順。

import type { Goal, GoalTask, GoalTaskStatus, MonthlyReview, PracticeSession } from '../types';

// 目標の初期値。使い始めたときにこの内容が入っていて、あとから全部書き換えられる。
export const DEFAULT_GOAL: Goal = {
  bigGoal: '上のクラスに進級する',
  currentClass: '中級',
  pace: '週1回・1回90分',
  requirements: '', // 進級条件は未確認なので空欄から始める
  updatedAt: '',
};

// 保存・同期されたデータが壊れていても落ちないよう、文字列として整える。
export function resolveGoal(raw: unknown): Goal {
  const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_GOAL };
  const g = raw as Partial<Goal>;
  return {
    bigGoal: str(g.bigGoal, DEFAULT_GOAL.bigGoal),
    currentClass: str(g.currentClass, DEFAULT_GOAL.currentClass),
    pace: str(g.pace, DEFAULT_GOAL.pace),
    requirements: str(g.requirements, ''),
    updatedAt: str(g.updatedAt, ''),
  };
}

// 課題の状態。この順番が画面の選択肢の順番になる。
export const GOAL_TASK_STATUSES: GoalTaskStatus[] = ['未着手', '練習中', 'できてきた', '完了'];

// 状態ごとの見た目。練習中を一番目立たせ、完了は落ち着かせる。
export function taskStatusClass(status: GoalTaskStatus): string {
  switch (status) {
    case '練習中':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'できてきた':
      return 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300';
    case '完了':
      return 'border-gray-300 bg-gray-50 text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400';
    default: // 未着手
      return 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300';
  }
}

// 取り組み中の課題（完了していないもの）。気づいた日が古い順に並べ、
// 放置している古い課題が上に来るようにする。
export function openTasks(tasks: GoalTask[]): GoalTask[] {
  return tasks
    .filter((t) => t.status !== '完了')
    .sort((a, b) => a.noticedDate.localeCompare(b.noticedDate) || a.createdAt.localeCompare(b.createdAt));
}

// 完了した課題。終わったものは新しい順（最近できるようになったものが上）。
export function doneTasks(tasks: GoalTask[]): GoalTask[] {
  return tasks
    .filter((t) => t.status === '完了')
    .sort((a, b) => b.noticedDate.localeCompare(a.noticedDate) || b.createdAt.localeCompare(a.createdAt));
}

// 振り返りは新しい月が上。
export function sortedReviews(reviews: MonthlyReview[]): MonthlyReview[] {
  return [...reviews].sort((a, b) => b.month.localeCompare(a.month));
}

// その月の練習記録の件数。レッスン回数の初期値と、ずれの表示に使う。
export function practiceCountOfMonth(sessions: PracticeSession[], month: string): number {
  return sessions.filter((s) => s.date.slice(0, 7) === month).length;
}

// 今月を YYYY-MM で返す（ローカルタイムゾーン基準）。
export function currentMonth(todayISO: string): string {
  return todayISO.slice(0, 7);
}
