import { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  clearNavOrder,
  loadNavOrder,
  moveItem,
  saveNavOrder,
  type NavItem,
} from '../lib/navOrder';

interface Props {
  // タブに出す数字バッジ（パス → 件数）。0以下なら出さない。
  badges?: Record<string, number>;
}

// ヘッダーのタブ。「並び替え」ボタンで編集モードに入り、ドラッグで順番を入れ替えられる。
// 通常モードでは横スクロールのままにしたいので、ドラッグ操作は編集モード中だけ有効にする。
export default function NavTabs({ badges = {} }: Props) {
  const { pathname } = useLocation();
  const [items, setItems] = useState<NavItem[]>(() => loadNavOrder());
  const [editing, setEditing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);

  function commit(next: NavItem[]) {
    setItems(next);
    saveNavOrder(next);
  }

  function resetOrder() {
    clearNavOrder();
    setItems(loadNavOrder());
  }

  // ポインタ位置に重なっているタブの番号（なければ -1）。
  // 「重なっているタブ」だけを入れ替え先にすることで、入れ替え直後は
  // ポインタがドラッグ中のタブの上に来るため、往復してブレるのを防げる。
  function indexAtPoint(x: number, y: number): number {
    for (let i = 0; i < tabRefs.current.length; i++) {
      const el = tabRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, index: number) {
    // 指がタブの外に出ても追従させる。捕捉できない環境でも並び替え自体は動くので握りつぶす。
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    setDragIndex(index);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragIndex === null) return;
    const target = indexAtPoint(e.clientX, e.clientY);
    if (target < 0 || target === dragIndex) return;
    setItems((prev) => moveItem(prev, dragIndex, target));
    setDragIndex(target);
  }

  function onPointerUp() {
    if (dragIndex === null) return;
    setDragIndex(null);
    saveNavOrder(items);
  }

  // キーボードでも並び替えられるようにする（← →）。
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (delta === 0) return;
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    e.preventDefault();
    commit(moveItem(items, index, target));
    // 移動後も同じタブにフォーカスを残す
    requestAnimationFrame(() => tabRefs.current[target]?.focus());
  }

  return (
    <nav className="mx-auto max-w-4xl px-2">
      <div className="flex items-start gap-1 pb-2">
        <div className={editing ? 'flex flex-1 flex-wrap gap-1' : 'flex flex-1 gap-1 overflow-x-auto'}>
          {items.map((item, index) => {
            const badge = badges[item.to] ?? 0;
            const badgeEl =
              badge > 0 ? (
                <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white/30">
                  {badge}
                </span>
              ) : null;

            if (editing) {
              const isCurrent = item.end ? pathname === item.to : pathname.startsWith(item.to);
              const isDragging = dragIndex === index;
              return (
                <button
                  key={item.to}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  onPointerDown={(e) => onPointerDown(e, index)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  aria-label={`${item.label}（${items.length}個中${index + 1}番目。ドラッグまたは左右キーで並び替え）`}
                  style={{ touchAction: 'none' }}
                  className={`relative flex shrink-0 cursor-grab items-center whitespace-nowrap rounded-full border border-dashed px-3 py-1.5 text-sm font-medium transition ${
                    isDragging
                      ? 'scale-105 border-white bg-white text-emerald-700 shadow-md'
                      : isCurrent
                        ? 'border-white/70 bg-white/90 text-emerald-700'
                        : 'border-white/50 text-emerald-50 hover:bg-white/15'
                  }`}
                >
                  <span className="mr-1 opacity-60" aria-hidden>
                    ⠿
                  </span>
                  {item.label}
                  {badgeEl}
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex shrink-0 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-50 hover:bg-white/15'
                  }`
                }
              >
                {item.label}
                {badgeEl}
              </NavLink>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {editing && (
            <button
              type="button"
              onClick={resetOrder}
              className="rounded-full border border-white/40 px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
            >
              既定に戻す
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
            aria-label={editing ? '並び替えを終了' : 'タブを並び替える'}
            title={editing ? '並び替えを終了' : 'タブをドラッグして並び替える'}
            className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold leading-none ${
              editing
                ? 'border-white bg-white text-emerald-700'
                : 'border-white/40 text-white/90 hover:bg-white/15'
            }`}
          >
            {editing ? '完了' : '⇅'}
          </button>
        </div>
      </div>
      {editing && (
        <p className="pb-2 text-[11px] text-emerald-50/80">
          タブをドラッグ（キーボードなら ← → ）で並び替えできます。並び順はこの端末にだけ保存されます。
        </p>
      )}
    </nav>
  );
}
