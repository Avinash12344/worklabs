'use client';

export function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const interactive = !!onChange;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <svg
            className={`${sizes[size]} ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-slate-300'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.5a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function RatingBadge({
  average,
  total,
  size = 'md',
}: {
  average: number | null;
  total: number;
  size?: 'sm' | 'md';
}) {
  if (average === null || total === 0) {
    return <span className="text-sm text-slate-500">No reviews yet</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <StarRating
        value={Math.round(average)}
        size={size === 'sm' ? 'sm' : 'md'}
      />
      <span
        className={`font-semibold text-slate-900 ${
          size === 'sm' ? 'text-sm' : 'text-base'
        }`}
      >
        {average.toFixed(1)}
      </span>
      <span className="text-sm text-slate-500">({total})</span>
    </div>
  );
}