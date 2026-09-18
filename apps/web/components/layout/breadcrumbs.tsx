import Link from 'next/link';
import { Fragment } from 'react';

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-bodySm text-slate-500 dark:text-slate-400 mb-4"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            {isLast || !item.href ? (
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}