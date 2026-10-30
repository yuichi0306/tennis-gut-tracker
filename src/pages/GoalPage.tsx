import { useEffect, useState } from 'react';
import { useGoal } from '../hooks/useGoal';
import { usePracticeSessions } from '../hooks/usePracticeSessions';
import type { GoalTask, GoalTaskStatus, MonthlyReview } from '../types';
import { todayISO } from '../lib/date';
import {
  GOAL_TASK_STATUSES,
  taskStatusClass,
  openTasks,
  doneTasks,
  sortedReviews,
  practiceCountOfMonth,
  currentMonth,
} from '../lib/goal';

const inputClass = 'rounded border border-gray-300 px-2 py-1.5 dark:border-slate-600';

export default function GoalPage() {
  const {
    goal, updateGoal,
    tasks, addTask, updateTask, deleteTask,
    reviews, addReview, updateReview, deleteReview,
  } = useGoal();
  const { sessions } = usePracticeSessions();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">目標</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          大きな目標と現在地、いま取り組んでいる課題、月ごとの振り返りをまとめておく場所です。内容はいつでも書き換えられます。
        </p>
      </div>

      <GoalCard goal={goal} onSave={updateGoal} />

      <TaskSection
        tasks={tasks}
        onAdd={addTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      <ReviewSection
        reviews={reviews}
        practiceCountOf={(month) => practiceCountOfMonth(sessions, month)}
        onAdd={addReview}
        onUpdate={updateReview}
        onDelete={deleteReview}
      />
    </div>
  );
}

// ---- 目標と現在地 ----

function GoalCard({
  goal,
  onSave,
}: {
  goal: ReturnType<typeof useGoal>['goal'];
  onSave: ReturnType<typeof useGoal>['updateGoal'];
}) {
  const [editing, setEditing] = useState(false);
  const [bigGoal, setBigGoal] = useState(goal.bigGoal);
  const [currentClass, setCurrentClass] = useState(goal.currentClass);
  const [pace, setPace] = useState(goal.pace);
  const [requirements, setRequirements] = useState(goal.requirements);

  function startEdit() {
    setBigGoal(goal.bigGoal);
    setCurrentClass(goal.currentClass);
    setPace(goal.pace);
    setRequirements(goal.requirements);
    setEditing(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      bigGoal: bigGoal.trim(),
      currentClass: currentClass.trim(),
      pace: pace.trim(),
      requirements: requirements.trim(),
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <section>
        <h3 className="mb-2 text-base font-bold">目標と現在地を編集</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            大目標
            <input type="text" value={bigGoal} onChange={(e) => setBigGoal(e.target.value)} placeholder="例: 上のクラスに進級する" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            現在のクラス
            <input type="text" value={currentClass} onChange={(e) => setCurrentClass(e.target.value)} placeholder="例: 中級" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            練習ペース
            <input type="text" value={pace} onChange={(e) => setPace(e.target.value)} placeholder="例: 週1回・1回90分" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            進級条件（分かったら書く）
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} placeholder="コーチに聞いて分かったことを書きます" className={inputClass} />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
              保存する
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              キャンセル
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">大目標</p>
          <p className="mt-0.5 text-lg font-bold">{goal.bigGoal || '（未設定）'}</p>
        </div>
        <button onClick={startEdit} className="shrink-0 text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          編集
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 dark:border-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-gray-500 dark:text-slate-400">現在のクラス</dt>
          <dd className="font-semibold">{goal.currentClass || '（未設定）'}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-slate-400">練習ペース</dt>
          <dd className="font-semibold">{goal.pace || '（未設定）'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-gray-500 dark:text-slate-400">進級条件</dt>
          <dd className={goal.requirements ? 'whitespace-pre-wrap text-sm' : 'text-sm text-gray-400 dark:text-slate-500'}>
            {goal.requirements || 'まだ確認していません。コーチに聞いたら「編集」から書き足してください。'}
          </dd>
        </div>
      </dl>
    </section>
  );
}

// ---- 課題リスト ----

function TaskSection({
  tasks,
  onAdd,
  onUpdate,
  onDelete,
}: {
  tasks: GoalTask[];
  onAdd: ReturnType<typeof useGoal>['addTask'];
  onUpdate: ReturnType<typeof useGoal>['updateTask'];
  onDelete: ReturnType<typeof useGoal>['deleteTask'];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [noticedDate, setNoticedDate] = useState(todayISO());
  const [status, setStatus] = useState<GoalTaskStatus>('未着手');
  const [notes, setNotes] = useState('');
  const [showDone, setShowDone] = useState(false);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setNoticedDate(todayISO());
    setStatus('未着手');
    setNotes('');
  }

  function startEdit(t: GoalTask) {
    setEditingId(t.id);
    setTitle(t.title);
    setNoticedDate(t.noticedDate);
    setStatus(t.status);
    setNotes(t.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = { title: title.trim(), noticedDate, status, notes: notes.trim() };
    if (editingId) onUpdate(editingId, payload);
    else onAdd(payload);
    resetForm();
  }

  const open = openTasks(tasks);
  const done = doneTasks(tasks);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-bold">{editingId ? '課題を編集' : '課題リスト'}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          レッスンで気づいたことを残しておきます。気づいた日が古いものから上に並ぶので、ほうっておいた課題に気づけます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          課題
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: バックハンドで体が開く" className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          気づいた日
          <input type="date" value={noticedDate} onChange={(e) => setNoticedDate(e.target.value)} className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          状態
          <select value={status} onChange={(e) => setStatus(e.target.value as GoalTaskStatus)} className={inputClass}>
            {GOAL_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          メモ
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="コーチに言われたこと、意識する点など" className={inputClass} />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
            {editingId ? '更新する' : '課題を追加'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              キャンセル
            </button>
          )}
        </div>
      </form>

      {open.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">取り組み中の課題はありません。</p>
      ) : (
        <ul className="space-y-2">
          {open.map((task) => (
            <TaskRow key={task.id} task={task} onUpdate={onUpdate} onEdit={startEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="text-sm text-gray-600 hover:underline dark:text-slate-300"
          >
            {showDone ? '▼' : '▶'} 完了した課題（{done.length}件）
          </button>
          {showDone && (
            <ul className="mt-2 space-y-2">
              {done.map((task) => (
                <TaskRow key={task.id} task={task} onUpdate={onUpdate} onEdit={startEdit} onDelete={onDelete} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function TaskRow({
  task,
  onUpdate,
  onEdit,
  onDelete,
}: {
  task: GoalTask;
  onUpdate: ReturnType<typeof useGoal>['updateTask'];
  onEdit: (t: GoalTask) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === '完了';
  return (
    <li className={`rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800 ${isDone ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-semibold ${isDone ? 'text-gray-500 dark:text-slate-400' : ''}`}>{task.title}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">気づいた日: {task.noticedDate}</p>
          {task.notes && <p className="mt-1 whitespace-pre-wrap text-gray-500 dark:text-slate-400">メモ: {task.notes}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* 状態はよく変えるので、一覧から直接選べるようにする */}
          <select
            value={task.status}
            onChange={(e) => onUpdate(task.id, { status: e.target.value as GoalTaskStatus })}
            aria-label={`${task.title} の状態`}
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${taskStatusClass(task.status)}`}
          >
            {GOAL_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex gap-3 text-xs">
            <button onClick={() => onEdit(task)} className="text-emerald-700 hover:underline dark:text-emerald-400">編集</button>
            <button
              onClick={() => { if (confirm(`課題「${task.title}」を削除しますか？`)) onDelete(task.id); }}
              className="text-red-600 hover:underline dark:text-red-400"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

// ---- 月ごとの振り返り ----

function ReviewSection({
  reviews,
  practiceCountOf,
  onAdd,
  onUpdate,
  onDelete,
}: {
  reviews: MonthlyReview[];
  practiceCountOf: (month: string) => number;
  onAdd: ReturnType<typeof useGoal>['addReview'];
  onUpdate: ReturnType<typeof useGoal>['updateReview'];
  onDelete: ReturnType<typeof useGoal>['deleteReview'];
}) {
  const thisMonth = currentMonth(todayISO());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState(thisMonth);
  const [lessonCount, setLessonCount] = useState('0');
  const [lessonCountEdited, setLessonCountEdited] = useState(false);
  const [theme, setTheme] = useState('');
  const [achieved, setAchieved] = useState('');
  const [carryOver, setCarryOver] = useState('');

  const fromPractice = practiceCountOf(month);

  // 手で直していない限り、レッスン回数はその月の練習記録の件数に合わせる。
  // 起動直後は記録の読み込みが終わっていないので、初期値ではなくここで合わせる。
  useEffect(() => {
    if (editingId || lessonCountEdited) return;
    setLessonCount(String(fromPractice));
  }, [fromPractice, editingId, lessonCountEdited]);

  function changeLessonCount(next: string) {
    setLessonCount(next);
    setLessonCountEdited(true);
  }

  function resetForm() {
    setEditingId(null);
    setMonth(thisMonth);
    setLessonCountEdited(false); // 自動の件数に戻す（上の useEffect が入れ直す）
    setTheme('');
    setAchieved('');
    setCarryOver('');
  }

  function startEdit(r: MonthlyReview) {
    setEditingId(r.id);
    setMonth(r.month);
    setLessonCount(String(r.lessonCount));
    setLessonCountEdited(r.lessonCountEdited);
    setTheme(r.theme);
    setAchieved(r.achieved);
    setCarryOver(r.carryOver);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!month) return;
    const payload = {
      month,
      lessonCount: Math.max(0, Number(lessonCount) || 0),
      lessonCountEdited,
      theme: theme.trim(),
      achieved: achieved.trim(),
      carryOver: carryOver.trim(),
    };
    if (editingId) onUpdate(editingId, payload);
    else onAdd(payload);
    resetForm();
  }

  const list = sortedReviews(reviews);
  // 同じ月の振り返りが既にあるときは、作る前に気づけるようにする
  const duplicate = !editingId && reviews.some((r) => r.month === month);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-bold">{editingId ? '振り返りを編集' : '月ごとの振り返り'}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          月末にその月を振り返って残しておきます。レッスン回数はその月の練習記録の件数が入るので、違っていれば直してください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          年月
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          レッスン回数
          <input type="number" value={lessonCount} onChange={(e) => changeLessonCount(e.target.value)} min="0" className={inputClass} />
          <span className="text-xs text-gray-400 dark:text-slate-500">
            練習記録では{fromPractice}回
            {lessonCountEdited && Number(lessonCount) !== fromPractice && '（手で直した値を使います）'}
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          その月のテーマ
          <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="例: バックハンドを固める" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          できるようになったこと
          <textarea value={achieved} onChange={(e) => setAchieved(e.target.value)} rows={2} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          次に持ち越すこと
          <textarea value={carryOver} onChange={(e) => setCarryOver(e.target.value)} rows={2} className={inputClass} />
        </label>
        {duplicate && (
          <p className="text-xs text-amber-700 dark:text-amber-300 sm:col-span-2">
            {month} の振り返りはすでにあります。追加するともう1件できます。
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
            {editingId ? '更新する' : '振り返りを追加'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              キャンセル
            </button>
          )}
        </div>
      </form>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">まだ振り返りがありません。</p>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold">
                  {r.month.replace('-', '年')}月
                  <span className="ml-3 text-xs font-normal text-gray-500 dark:text-slate-400">レッスン{r.lessonCount}回</span>
                </p>
                <div className="flex gap-3 text-xs">
                  <button onClick={() => startEdit(r)} className="text-emerald-700 hover:underline dark:text-emerald-400">編集</button>
                  <button
                    onClick={() => { if (confirm(`${r.month} の振り返りを削除しますか？`)) onDelete(r.id); }}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    削除
                  </button>
                </div>
              </div>
              {r.theme && <p className="mt-1">テーマ: {r.theme}</p>}
              {r.achieved && (
                <p className="mt-2 whitespace-pre-wrap">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">できるようになったこと</span>
                  <br />{r.achieved}
                </p>
              )}
              {r.carryOver && (
                <p className="mt-2 whitespace-pre-wrap">
                  <span className="font-semibold text-amber-700 dark:text-amber-300">次に持ち越すこと</span>
                  <br />{r.carryOver}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
