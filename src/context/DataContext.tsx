import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { readCloud, writeCloud, subscribeCloud, type CloudData } from '../lib/cloud';
import { racketStorage, shoeStorage, stringingStorage, practiceStorage, matchStorage, wishlistStorage, packingStorage, packingListStorage, loadPacking, goalStorage, goalTaskStorage, monthlyReviewStorage, settingsStorage, rosterStorage, matchmakerStorage, deletionStorage, syncMeta } from '../lib/storage';
import { deletionKey, mergeDeletions, noteDeletions } from '../lib/deletions';
import type { SavedSchedule } from '../lib/matchmaker';
import { DEFAULT_SETTINGS } from '../lib/settings';
import { DEFAULT_GOAL } from '../lib/goal';
import type { Racket, StringingRecord, PracticeSession, RestringSettings, RosterPlayer, Shoe, MatchRecord, WishItem, PackingItem, PackingList, Goal, GoalTask, MonthlyReview, DeletionKind } from '../types';

type LocalData = Omit<CloudData, 'updatedAt'>;
type Updater<T> = (prev: T) => T;

interface DataContextValue {
  // データ
  rackets: Racket[];
  shoes: Shoe[];
  stringingRecords: StringingRecord[];
  practiceSessions: PracticeSession[];
  matches: MatchRecord[];
  wishlist: WishItem[];
  packing: PackingItem[];
  packingLists: PackingList[];
  goal: Goal;
  goalTasks: GoalTask[];
  monthlyReviews: MonthlyReview[];
  settings: RestringSettings;
  roster: RosterPlayer[];
  matchmaker: SavedSchedule | null; // 生成した対戦表（クリアするまで残る）
  setRackets: (updater: Updater<Racket[]>) => void;
  setShoes: (updater: Updater<Shoe[]>) => void;
  setStringingRecords: (updater: Updater<StringingRecord[]>) => void;
  setPracticeSessions: (updater: Updater<PracticeSession[]>) => void;
  setMatches: (updater: Updater<MatchRecord[]>) => void;
  setWishlist: (updater: Updater<WishItem[]>) => void;
  setPacking: (updater: Updater<PackingItem[]>) => void;
  setPackingLists: (updater: Updater<PackingList[]>) => void;
  setGoal: (updater: Updater<Goal>) => void;
  setGoalTasks: (updater: Updater<GoalTask[]>) => void;
  setMonthlyReviews: (updater: Updater<MonthlyReview[]>) => void;
  setSettings: (updater: Updater<RestringSettings>) => void;
  setRoster: (updater: Updater<RosterPlayer[]>) => void;
  setMatchmaker: (updater: Updater<SavedSchedule | null>) => void;
  // 認証・同期
  user: User | null;
  authReady: boolean;
  syncing: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

// 統合に失敗したとき、次に試すまでの待ち時間(ms)
const SYNC_RETRY_MS = 30000;

type ListKind = Exclude<DeletionKind, 'matchmaker'>;
const LIST_KINDS: ListKind[] = ['rackets', 'shoes', 'stringingRecords', 'practiceSessions', 'matches', 'wishlist', 'packing', 'packingLists', 'roster', 'goalTasks', 'monthlyReviews'];

// 対戦表は1件なので、作成日時を id の代わりにする
function matchmakerIds(s: SavedSchedule | null): string[] {
  return s ? [s.createdAt] : [];
}

// 2つの配列を id で結合する（重複 id は b を優先）。
function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const x of a) map.set(x.id, x);
  for (const x of b) map.set(x.id, x);
  return [...map.values()];
}

// ローカルとクラウドを結合して取りこぼしを防ぐ。削除済みの記録にある項目は結合後に取り除く。
// edits は統合が終わる前に画面で変更したもの。古いクラウドより、この入力を優先する。
function mergeLocalAndCloud(local: LocalData, cloud: LocalData, edits: Set<string>): LocalData {
  // バックアップで置き換えるより前の削除は、この端末に残っていても効かせない
  const restoredAt = Math.max(local.restoredAt, cloud.restoredAt);
  const deletions = mergeDeletions(local.deletions.filter((d) => d.at > restoredAt), cloud.deletions);
  const deleted = new Set(deletions.map((d) => deletionKey(d.kind, d.id)));
  const merge = <T extends { id: string }>(kind: ListKind, a: T[], b: T[]): T[] => {
    const edited = a.filter((x) => edits.has(deletionKey(kind, x.id)));
    return mergeById(mergeById(a, b), edited).filter((x) => !deleted.has(deletionKey(kind, x.id)));
  };
  // 対戦表は1件だけなので結合できない。クラウド側を優先（無ければローカル）
  const matchmaker = edits.has('matchmaker') ? local.matchmaker : (cloud.matchmaker ?? local.matchmaker);
  return {
    rackets: merge('rackets', local.rackets, cloud.rackets),
    shoes: merge('shoes', local.shoes, cloud.shoes),
    stringingRecords: merge('stringingRecords', local.stringingRecords, cloud.stringingRecords),
    practiceSessions: merge('practiceSessions', local.practiceSessions, cloud.practiceSessions),
    matches: merge('matches', local.matches, cloud.matches),
    wishlist: merge('wishlist', local.wishlist, cloud.wishlist),
    packing: merge('packing', local.packing, cloud.packing),
    packingLists: merge('packingLists', local.packingLists, cloud.packingLists),
    roster: merge('roster', local.roster, cloud.roster),
    goalTasks: merge('goalTasks', local.goalTasks, cloud.goalTasks),
    monthlyReviews: merge('monthlyReviews', local.monthlyReviews, cloud.monthlyReviews),
    // 設定・目標は1件なので結合できない。クラウド側を優先（無ければローカル）
    settings: edits.has('settings') ? local.settings : (cloud.settings ?? local.settings),
    goal: edits.has('goal') ? local.goal : (cloud.goal ?? local.goal),
    matchmaker: matchmaker && !deleted.has(deletionKey('matchmaker', matchmaker.createdAt)) ? matchmaker : null,
    deletions,
    restoredAt,
  };
}

// バックアップで置き換える：クラウドにあってバックアップに無い項目は削除済みとして記録し、
// 古いデータを持つ端末から戻らないようにする。バックアップにある項目の記録は外す。
function replaceWithBackup(local: LocalData, cloud: LocalData | null): LocalData {
  const now = Date.now();
  let deletions = mergeDeletions(local.deletions, cloud?.deletions ?? []);
  for (const kind of LIST_KINDS) {
    const prevIds = (cloud?.[kind] ?? []).map((x) => x.id);
    deletions = noteDeletions(deletions, kind, prevIds, local[kind].map((x) => x.id), now);
  }
  deletions = noteDeletions(deletions, 'matchmaker', matchmakerIds(cloud?.matchmaker ?? null), matchmakerIds(local.matchmaker), now);
  return { ...local, deletions, restoredAt: now };
}

const EMPTY_DATA: LocalData = {
  rackets: [],
  shoes: [],
  stringingRecords: [],
  practiceSessions: [],
  matches: [],
  wishlist: [],
  packing: [],
  packingLists: [],
  goal: DEFAULT_GOAL,
  goalTasks: [],
  monthlyReviews: [],
  settings: DEFAULT_SETTINGS,
  roster: [],
  matchmaker: null,
  deletions: [],
  restoredAt: 0,
};

// ログイン時にローカルとクラウドをどう統合するかを決める。
// - 復元直後(pendingReplace)      : ローカル(=バックアップ)で完全に置き換える
// - 持ち主が未設定/同一アカウント : 取りこぼし防止のため結合（＝ローカルをクラウドへ吸い上げ）
// - 別アカウントのローカルデータ   : 引き継がず、クラウド側を採用する
function resolveOnLogin(local: LocalData, cloud: LocalData | null, uid: string, edits: Set<string>): LocalData {
  if (syncMeta.isPendingReplace()) return replaceWithBackup(local, cloud);
  const owner = syncMeta.getOwner();
  if (owner === null || owner === uid) {
    return cloud ? mergeLocalAndCloud(local, cloud, edits) : local;
  }
  return cloud ?? EMPTY_DATA;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [rackets, setRacketsState] = useState<Racket[]>([]);
  const [shoes, setShoesState] = useState<Shoe[]>([]);
  const [matches, setMatchesState] = useState<MatchRecord[]>([]);
  const [wishlist, setWishlistState] = useState<WishItem[]>([]);
  const [packing, setPackingState] = useState<PackingItem[]>([]);
  const [packingLists, setPackingListsState] = useState<PackingList[]>([]);
  const [goal, setGoalState] = useState<Goal>(DEFAULT_GOAL);
  const [goalTasks, setGoalTasksState] = useState<GoalTask[]>([]);
  const [monthlyReviews, setMonthlyReviewsState] = useState<MonthlyReview[]>([]);
  const [stringingRecords, setStringingState] = useState<StringingRecord[]>([]);
  const [practiceSessions, setPracticeState] = useState<PracticeSession[]>([]);
  const [settings, setSettingsState] = useState<RestringSettings>(DEFAULT_SETTINGS);
  const [roster, setRosterState] = useState<RosterPlayer[]>([]);
  const [matchmaker, setMatchmakerState] = useState<SavedSchedule | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 全データの最新値。レンダーを待たず即座に更新するので、1つのハンドラで
  // 複数の setter を続けて呼んでも、常に最新の全体をクラウドへ書ける。
  const dataRef = useRef<LocalData>({
    rackets: [],
    shoes: [],
    stringingRecords: [],
    practiceSessions: [],
    matches: [],
    wishlist: [],
    packing: [],
    packingLists: [],
    goal: DEFAULT_GOAL,
    goalTasks: [],
    monthlyReviews: [],
    settings: DEFAULT_SETTINGS,
    roster: [],
    matchmaker: null,
    deletions: [],
    restoredAt: 0,
  });
  // 統合を終えてクラウドへ書いてよいアカウント。null の間は書き込まない。
  const mergedUidRef = useRef<string | null>(null);
  // 統合が終わる前に画面で変更した項目（統合時にクラウドより優先する）
  const unmergedEditsRef = useRef(new Set<string>());

  // 起動時にローカルから読み込む（未ログイン・オフラインでもそのまま動く）
  useEffect(() => {
    // 持ち物は、複数リスト対応より前のデータを移行してから読み込む
    const localPacking = loadPacking();
    const local: LocalData = {
      rackets: racketStorage.getAll(),
      shoes: shoeStorage.getAll(),
      stringingRecords: stringingStorage.getAll(),
      practiceSessions: practiceStorage.getAll(),
      matches: matchStorage.getAll(),
      wishlist: wishlistStorage.getAll(),
      packing: localPacking.items,
      packingLists: localPacking.lists,
      goal: goalStorage.get(),
      goalTasks: goalTaskStorage.getAll(),
      monthlyReviews: monthlyReviewStorage.getAll(),
      settings: settingsStorage.get(),
      roster: rosterStorage.getAll(),
      matchmaker: matchmakerStorage.get(),
      deletions: deletionStorage.getAll(),
      restoredAt: syncMeta.getRestoredAt(),
    };
    dataRef.current = local;
    setRacketsState(local.rackets);
    setShoesState(local.shoes);
    setStringingState(local.stringingRecords);
    setPracticeState(local.practiceSessions);
    setMatchesState(local.matches);
    setWishlistState(local.wishlist);
    setPackingState(local.packing);
    setPackingListsState(local.packingLists);
    setGoalState(local.goal);
    setGoalTasksState(local.goalTasks);
    setMonthlyReviewsState(local.monthlyReviews);
    setSettingsState(local.settings);
    setRosterState(local.roster);
    setMatchmakerState(local.matchmaker);
  }, []);

  // クラウドから来たデータを画面とローカルに反映する（クラウドへは書き戻さない）
  function applyData(d: LocalData) {
    dataRef.current = d;
    setRacketsState(d.rackets);
    setShoesState(d.shoes);
    setStringingState(d.stringingRecords);
    setPracticeState(d.practiceSessions);
    setMatchesState(d.matches);
    setWishlistState(d.wishlist);
    setPackingState(d.packing);
    setPackingListsState(d.packingLists);
    setGoalState(d.goal);
    setGoalTasksState(d.goalTasks);
    setMonthlyReviewsState(d.monthlyReviews);
    setSettingsState(d.settings);
    setRosterState(d.roster);
    setMatchmakerState(d.matchmaker);
    racketStorage.save(d.rackets);
    shoeStorage.save(d.shoes);
    stringingStorage.save(d.stringingRecords);
    practiceStorage.save(d.practiceSessions);
    matchStorage.save(d.matches);
    wishlistStorage.save(d.wishlist);
    packingStorage.save(d.packing);
    packingListStorage.save(d.packingLists);
    goalStorage.save(d.goal);
    goalTaskStorage.save(d.goalTasks);
    monthlyReviewStorage.save(d.monthlyReviews);
    settingsStorage.save(d.settings);
    rosterStorage.save(d.roster);
    matchmakerStorage.save(d.matchmaker);
    deletionStorage.save(d.deletions);
    syncMeta.setRestoredAt(d.restoredAt);
  }

  // 現在の全データをクラウドへ反映する（ログイン中かつ統合後のみ）。
  // 統合前の古いデータでクラウドを上書きしないよう、統合が終わるまでは書かない。
  // その間の変更は dataRef に残っているので、統合のあとにまとめて書かれる。
  function pushCloud() {
    const uid = auth.currentUser?.uid;
    if (!uid || mergedUidRef.current !== uid) return;
    writeCloud(uid, dataRef.current).catch((e) => console.error('クラウド保存に失敗:', e));
  }

  // 一覧の変更を記録する：消えた項目を削除済みにし、統合前なら変更した項目も控える。
  function trackList<T extends { id: string }>(kind: ListKind, next: T[]) {
    const prev = dataRef.current[kind] as unknown as T[];
    recordDeletions(kind, prev.map((x) => x.id), next.map((x) => x.id));
    if (mergedUidRef.current) return;
    const prevById = new Map(prev.map((x) => [x.id, x]));
    for (const x of next) {
      if (prevById.get(x.id) !== x) unmergedEditsRef.current.add(deletionKey(kind, x.id));
    }
  }

  function recordDeletions(kind: DeletionKind, prevIds: string[], nextIds: string[]) {
    const deletions = noteDeletions(dataRef.current.deletions, kind, prevIds, nextIds, Date.now());
    if (deletions === dataRef.current.deletions) return;
    dataRef.current = { ...dataRef.current, deletions };
    deletionStorage.save(deletions);
  }

  // 1件だけのデータ（設定・目標・対戦表）の変更を、統合前なら控える
  function trackSingle(key: 'settings' | 'goal' | 'matchmaker') {
    if (!mergedUidRef.current) unmergedEditsRef.current.add(key);
  }

  // 認証状態の監視。リダイレクト方式でログインした場合の結果もここで拾われる。
  useEffect(() => {
    getRedirectResult(auth).catch((e) => console.error('リダイレクトログインの完了に失敗:', e));
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // ログインしたら、ローカルとクラウドを統合してリアルタイム購読を開始。
  // オフラインの間は書き込みを止め、つながったら統合し直す（古い全データで上書きしないため）。
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let running = false;
    let unsubscribe: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    async function startSync(uid: string) {
      if (cancelled || running || mergedUidRef.current === uid) return;
      running = true;
      clearTimeout(retryTimer);
      setSyncing(true);
      try {
        const cloud = await readCloud(uid);
        if (cancelled) return;
        const resolved = resolveOnLogin(dataRef.current, cloud, uid, unmergedEditsRef.current);
        applyData(resolved);
        syncMeta.setOwner(uid); // このローカルデータの持ち主を記録
        await writeCloud(uid, resolved); // 統合結果をクラウドへ反映
        if (cancelled) return;
        syncMeta.clearPendingReplace();
        mergedUidRef.current = uid;
        unmergedEditsRef.current.clear();
        // 統合結果を書いている間の入力は、ここで追いかけて書く
        if (dataRef.current !== resolved) pushCloud();
        // 統合前に購読を始めると、届いたクラウドデータで未同期のローカルデータを
        // 上書きしてしまう。統合できた時だけ購読する。
        // 以降はクラウドの変更を購読して反映（他端末の更新がここで届く）
        unsubscribe = subscribeCloud(uid, (remote) => {
          // 復元直後（リロード待ち）はクラウドで上書きしない。復元＝置き換えを守る。
          if (remote && !syncMeta.isPendingReplace()) applyData(remote);
        });
        setSyncing(false);
      } catch (e) {
        console.error('初回同期に失敗:', e);
        if (!cancelled) retryTimer = setTimeout(() => startSync(uid), SYNC_RETRY_MS);
      } finally {
        running = false;
      }
    }

    function pauseSync() {
      mergedUidRef.current = null;
      unsubscribe?.();
      unsubscribe = undefined;
      setSyncing(true);
    }
    const uid = user.uid;
    const resumeSync = () => startSync(uid);

    window.addEventListener('offline', pauseSync);
    window.addEventListener('online', resumeSync);
    startSync(uid);

    return () => {
      cancelled = true;
      mergedUidRef.current = null;
      clearTimeout(retryTimer);
      unsubscribe?.();
      window.removeEventListener('offline', pauseSync);
      window.removeEventListener('online', resumeSync);
    };
  }, [user]);

  // 画面から呼ぶ setter：状態＋ローカル保存＋クラウド反映をまとめて行う。
  // 直前の値は dataRef から取る（state はレンダーまで更新されないため、
  // 1つのハンドラで setter を複数回呼んでも取りこぼさない）。
  const setRackets = (updater: Updater<Racket[]>) => {
    const next = updater(dataRef.current.rackets);
    trackList('rackets', next);
    dataRef.current = { ...dataRef.current, rackets: next };
    setRacketsState(next);
    racketStorage.save(next);
    pushCloud();
  };
  const setShoes = (updater: Updater<Shoe[]>) => {
    const next = updater(dataRef.current.shoes);
    trackList('shoes', next);
    dataRef.current = { ...dataRef.current, shoes: next };
    setShoesState(next);
    shoeStorage.save(next);
    pushCloud();
  };
  const setMatches = (updater: Updater<MatchRecord[]>) => {
    const next = updater(dataRef.current.matches);
    trackList('matches', next);
    dataRef.current = { ...dataRef.current, matches: next };
    setMatchesState(next);
    matchStorage.save(next);
    pushCloud();
  };
  const setWishlist = (updater: Updater<WishItem[]>) => {
    const next = updater(dataRef.current.wishlist);
    trackList('wishlist', next);
    dataRef.current = { ...dataRef.current, wishlist: next };
    setWishlistState(next);
    wishlistStorage.save(next);
    pushCloud();
  };
  const setPacking = (updater: Updater<PackingItem[]>) => {
    const next = updater(dataRef.current.packing);
    trackList('packing', next);
    dataRef.current = { ...dataRef.current, packing: next };
    setPackingState(next);
    packingStorage.save(next);
    pushCloud();
  };
  const setPackingLists = (updater: Updater<PackingList[]>) => {
    const next = updater(dataRef.current.packingLists);
    trackList('packingLists', next);
    dataRef.current = { ...dataRef.current, packingLists: next };
    setPackingListsState(next);
    packingListStorage.save(next);
    pushCloud();
  };
  const setGoal = (updater: Updater<Goal>) => {
    const next = updater(dataRef.current.goal);
    trackSingle('goal');
    dataRef.current = { ...dataRef.current, goal: next };
    setGoalState(next);
    goalStorage.save(next);
    pushCloud();
  };
  const setGoalTasks = (updater: Updater<GoalTask[]>) => {
    const next = updater(dataRef.current.goalTasks);
    trackList('goalTasks', next);
    dataRef.current = { ...dataRef.current, goalTasks: next };
    setGoalTasksState(next);
    goalTaskStorage.save(next);
    pushCloud();
  };
  const setMonthlyReviews = (updater: Updater<MonthlyReview[]>) => {
    const next = updater(dataRef.current.monthlyReviews);
    trackList('monthlyReviews', next);
    dataRef.current = { ...dataRef.current, monthlyReviews: next };
    setMonthlyReviewsState(next);
    monthlyReviewStorage.save(next);
    pushCloud();
  };
  const setStringingRecords = (updater: Updater<StringingRecord[]>) => {
    const next = updater(dataRef.current.stringingRecords);
    trackList('stringingRecords', next);
    dataRef.current = { ...dataRef.current, stringingRecords: next };
    setStringingState(next);
    stringingStorage.save(next);
    pushCloud();
  };
  const setPracticeSessions = (updater: Updater<PracticeSession[]>) => {
    const next = updater(dataRef.current.practiceSessions);
    trackList('practiceSessions', next);
    dataRef.current = { ...dataRef.current, practiceSessions: next };
    setPracticeState(next);
    practiceStorage.save(next);
    pushCloud();
  };
  const setSettings = (updater: Updater<RestringSettings>) => {
    const next = updater(dataRef.current.settings);
    trackSingle('settings');
    dataRef.current = { ...dataRef.current, settings: next };
    setSettingsState(next);
    settingsStorage.save(next);
    pushCloud();
  };
  const setRoster = (updater: Updater<RosterPlayer[]>) => {
    const next = updater(dataRef.current.roster);
    trackList('roster', next);
    dataRef.current = { ...dataRef.current, roster: next };
    setRosterState(next);
    rosterStorage.save(next);
    pushCloud();
  };

  const setMatchmaker = (updater: Updater<SavedSchedule | null>) => {
    const next = updater(dataRef.current.matchmaker);
    trackSingle('matchmaker');
    recordDeletions('matchmaker', matchmakerIds(dataRef.current.matchmaker), matchmakerIds(next));
    dataRef.current = { ...dataRef.current, matchmaker: next };
    setMatchmakerState(next);
    matchmakerStorage.save(next);
    pushCloud();
  };

  async function signIn() {
    // まずポップアップ。モバイルのPWA等でポップアップが使えない場合はリダイレクトへ切替。
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw e;
      }
    }
  }
  async function signOut() {
    await fbSignOut(auth);
  }

  return (
    <DataContext.Provider
      value={{
        rackets,
        shoes,
        stringingRecords,
        practiceSessions,
        matches,
        wishlist,
        packing,
        packingLists,
        goal,
        goalTasks,
        monthlyReviews,
        settings,
        roster,
        matchmaker,
        setRackets,
        setShoes,
        setMatches,
        setWishlist,
        setPacking,
        setPackingLists,
        setGoal,
        setGoalTasks,
        setMonthlyReviews,
        setStringingRecords,
        setPracticeSessions,
        setSettings,
        setRoster,
        setMatchmaker,
        user,
        authReady,
        syncing,
        signIn,
        signOut,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData は DataProvider の中で使ってください。');
  return ctx;
}
