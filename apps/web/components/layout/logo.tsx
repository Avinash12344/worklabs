import Link from 'next/link';

export function Logo({
  href = '/',
  showText = true,
  size = 'md',
}: {
  href?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: { box: 'w-7 h-7', text: 'text-h4', stroke: 2.2 },
    md: { box: 'w-8 h-8', text: 'text-h4', stroke: 2.5 },
    lg: { box: 'w-10 h-10', text: 'text-h3', stroke: 2.8 },
  };
  const s = sizes[size];

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 group"
      aria-label="WorkLabs home"
    >
      <span
        className={`${s.box} rounded-lg bg-brand-600 text-white flex items-center justify-center transition-colors group-hover:bg-brand-700`}
      >
        <svg
          viewBox="0 0 32 32"
          width="60%"
          height="60%"
          fill="none"
          stroke="currentColor"
          strokeWidth={s.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stylized W */}
          <path d="M6 10 L11 22 L16 15 L21 22 L26 10" />
        </svg>
      </span>
      {showText && (
        <span
          className={`${s.text} font-bold text-slate-900 dark:text-slate-100 tracking-tight`}
        >
          WorkLabs
        </span>
      )}
    </Link>
  );
}