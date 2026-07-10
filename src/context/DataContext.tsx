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
import { racketStorage, stringingStorage, practiceStorage, settingsStorage, rosterStorage, syncMeta } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/settings';
import type { Racket, StringingRecord, PracticeSession, RestringSettings, RosterPlayer } from '../types';

type LocalData = Omit<CloudData, 'updatedAt'>;
type Updater<T> = (prev: T) => T;

interface DataContextValue {
  // データ
  rackets: Racket[];
  stringingRecords: StringingRecord[];
  practiceSessions: PracticeSession[];
  settings: RestringSettings;
  roster: RosterPlayer[];
  setRackets: (updater: Updater<Racket[]>) => void;
  setStringingRecords: (updater: Updater<StringingRecord[]>) => void;
  setPracticeSessions: (updater: Updater<PracticeSession[]>) => void;
  setSettings: (updater: Updater<RestringSettings>) => void;
  setRoster: (updater: Updater<RosterPlayer[]>) => void;
  // 認証・同期
  user: User | null;
  authReady: boolean;
  syncing: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

// 2つの配列を id で結合する（重複 id は b を優先）。
function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const x of a) map.set(x.id, x);
  for (const x of b) map.set(x.id, x);
  return [...map.values()];
}

// 初回ログイン時：ローカルとクラウドを結合して取りこぼしを防ぐ（削除は結合では消えない）。
function mergeLocalAndCloud(local: LocalData, cloud: LocalData): LocalData {
  return {
    rackets: mergeById(local.rackets, cloud.rackets),
    stringingRecords: mergeById(local.stringingRecords, cloud.stringingRecords),
    practiceSessions: mergeById(local.practiceSessions, cloud.practiceSessions),
    roster: mergeById(local.roster, cloud.roster),
    // 設定はクラウド側を優先（無ければローカル）
    settings: cloud.settings ?? local.settings,
  };
}

const EMPTY_DATA: LocalData = {
  rackets: [],
  stringingRecords: [],
  practiceSessions: [],
  settings: DEFAULT_SETTINGS,
  roster: [],
};

// ログイン時にローカルとクラウドをどう統合するかを決める。
// - 復元直後(pendingReplace)      : ローカル(=バックアップ)で完全に置き換える
// - 持ち主が未設定/同一アカウント : 取りこぼし防止のため結合（＝ローカルをクラウドへ吸い上げ）
// - 別アカウントのローカルデータ   : 引き継がず、クラウド側を採用する
function resolveOnLogin(local: LocalData, cloud: LocalData | null, uid: string): LocalData {
  if (syncMeta.isPendingReplace()) return local;
  const owner = syncMeta.getOwner();
  if (owner === null || owner === uid) {
    return cloud ? mergeLocalAndCloud(local, cloud) : local;
  }
  return cloud ?? EMPTY_DATA;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [rackets, setRacketsState] = useState<Racket[]>([]);
  const [stringingRecords, setStringingState] = useState<StringingRecord[]>([]);
  const [practiceSessions, setPracticeState] = useState<PracticeSession[]>([]);
  const [settings, setSettingsState] = useState<RestringSettings>(DEFAULT_SETTINGS);
  const [roster, setRosterState] = useState<RosterPlayer[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 全データの最新値。レンダーを待たず即座に更新するので、1つのハンドラで
  // 複数の setter を続けて呼んでも、常に最新の全体をクラウドへ書ける。
  const dataRef = useRef<LocalData>({
    rackets: [],
    stringingRecords: [],
    practiceSessions: [],
    settings: DEFAULT_SETTINGS,
    roster: [],
  });

  // 起動時にローカルから読み込む（未ログイン・オフラインでもそのまま動く）
  useEffect(() => {
    const local: LocalData = {
      rackets: racketStorage.getAll(),
      stringingRecords: stringingStorage.getAll(),
      practiceSessions: practiceStorage.getAll(),
      settings: settingsStorage.get(),
      roster: rosterStorage.getAll(),
    };
    dataRef.current = local;
    setRacketsState(local.rackets);
    setStringingState(local.stringingRecords);
    setPracticeState(local.practiceSessions);
    setSettingsState(local.settings);
    setRosterState(local.roster);
  }, []);

  // クラウドから来たデータを画面とローカルに反映する（クラウドへは書き戻さない）
  function applyData(d: LocalData) {
    dataRef.current = d;
    setRacketsState(d.rackets);
    setStringingState(d.stringingRecords);
    setPracticeState(d.practiceSessions);
    setSettingsState(d.settings);
    setRosterState(d.roster);
    racketStorage.save(d.rackets);
    stringingStorage.save(d.stringingRecords);
    practiceStorage.save(d.practiceSessions);
    settingsStorage.save(d.settings);
    rosterStorage.save(d.roster);
  }

  // 現在の全データをクラウドへ反映する（ログイン中のみ）
  function pushCloud() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    writeCloud(uid, dataRef.current).catch((e) => console.error('クラウド保存に失敗:', e));
  }

  // 認証状態の監視。リダイレクト方式でログインした場合の結果もここで拾われる。
  useEffect(() => {
    getRedirectResult(auth).catch((e) => console.error('リダイレクトログインの完了に失敗:', e));
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // ログインしたら、ローカルとクラウドを統合してリアルタイム購読を開始
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      setSyncing(true);
      let merged = false;
      try {
        const cloud = await readCloud(user.uid);
        const local = dataRef.current;
        const resolved = resolveOnLogin(local, cloud, user.uid);
        if (cancelled) return;
        applyData(resolved);
        await writeCloud(user.uid, resolved); // 統合結果をクラウドへ反映
        syncMeta.setOwner(user.uid); // このローカルデータの持ち主を記録
        syncMeta.clearPendingReplace();
        merged = true;
      } catch (e) {
        console.error('初回同期に失敗:', e);
      } finally {
        if (!cancelled) setSyncing(false);
      }
      if (cancelled) return;
      // 統合前に購読を始めると、届いたクラウドデータで未同期のローカルデータを
      // 上書きしてしまう。統合できた時だけ購読する。
      if (!merged) return;
      // 以降はクラウドの変更を購読して反映（他端末の更新がここで届く）
      unsubscribe = subscribeCloud(user.uid, (remote) => {
        // 復元直後（リロード待ち）はクラウドで上書きしない。復元＝置き換えを守る。
        if (remote && !syncMeta.isPendingReplace()) applyData(remote);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  // 画面から呼ぶ setter：状態＋ローカル保存＋クラウド反映をまとめて行う。
  // 直前の値は dataRef から取る（state はレンダーまで更新されないため、
  // 1つのハンドラで setter を複数回呼んでも取りこぼさない）。
  const setRackets = (updater: Updater<Racket[]>) => {
    const next = updater(dataRef.current.rackets);
    dataRef.current = { ...dataRef.current, rackets: next };
    setRacketsState(next);
    racketStorage.save(next);
    pushCloud();
  };
  const setStringingRecords = (updater: Updater<StringingRecord[]>) => {
    const next = updater(dataRef.current.stringingRecords);
    dataRef.current = { ...dataRef.current, stringingRecords: next };
    setStringingState(next);
    stringingStorage.save(next);
    pushCloud();
  };
  const setPracticeSessions = (updater: Updater<PracticeSession[]>) => {
    const next = updater(dataRef.current.practiceSessions);
    dataRef.current = { ...dataRef.current, practiceSessions: next };
    setPracticeState(next);
    practiceStorage.save(next);
    pushCloud();
  };
  const setSettings = (updater: Updater<RestringSettings>) => {
    const next = updater(dataRef.current.settings);
    dataRef.current = { ...dataRef.current, settings: next };
    setSettingsState(next);
    settingsStorage.save(next);
    pushCloud();
  };
  const setRoster = (updater: Updater<RosterPlayer[]>) => {
    const next = updater(dataRef.current.roster);
    dataRef.current = { ...dataRef.current, roster: next };
    setRosterState(next);
    rosterStorage.save(next);
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
        stringingRecords,
        practiceSessions,
        settings,
        roster,
        setRackets,
        setStringingRecords,
        setPracticeSessions,
        setSettings,
        setRoster,
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
