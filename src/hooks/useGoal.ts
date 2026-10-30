import { v4 as uuidv4 } from 'uuid';
import type { Goal, GoalTask, MonthlyReview } from '../types';
import { useData } from '../context/DataContext';

export function useGoal() {
  const { goal, setGoal, goalTasks, setGoalTasks, monthlyReviews, setMonthlyReviews } = useData();

  // ---- 目標と現在地（1件）----

  function updateGoal(patch: Partial<Omit<Goal, 'updatedAt'>>) {
    setGoal((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
  }

  // ---- 課題リスト ----

  function addTask(task: Omit<GoalTask, 'id' | 'createdAt'>) {
    const newTask: GoalTask = { ...task, id: uuidv4(), createdAt: new Date().toISOString() };
    setGoalTasks((prev) => [...prev, newTask]);
    return newTask;
  }

  function updateTask(id: string, patch: Partial<Omit<GoalTask, 'id' | 'createdAt'>>) {
    setGoalTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function deleteTask(id: string) {
    setGoalTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // ---- 月ごとの振り返り ----

  function addReview(review: Omit<MonthlyReview, 'id' | 'createdAt'>) {
    const newReview: MonthlyReview = { ...review, id: uuidv4(), createdAt: new Date().toISOString() };
    setMonthlyReviews((prev) => [...prev, newReview]);
    return newReview;
  }

  function updateReview(id: string, patch: Partial<Omit<MonthlyReview, 'id' | 'createdAt'>>) {
    setMonthlyReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function deleteReview(id: string) {
    setMonthlyReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return {
    goal,
    updateGoal,
    tasks: goalTasks,
    addTask,
    updateTask,
    deleteTask,
    reviews: monthlyReviews,
    addReview,
    updateReview,
    deleteReview,
  };
}
