// 星評価（★1〜5）。onChange を渡すと入力用、省略すると表示専用。
// 同じ星をもう一度クリックすると 0（未評価）に戻せる。
interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
}

export default function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const readOnly = !onChange;
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <span className={`inline-flex items-center gap-0.5 ${textSize}`} role={readOnly ? 'img' : undefined} aria-label={readOnly ? `評価 ${value}／5` : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = (
          <span className={filled ? 'text-amber-400' : 'text-gray-300'}>★</span>
        );
        if (readOnly) return <span key={n}>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className="leading-none hover:scale-110"
            aria-label={`${n}つ星`}
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}
