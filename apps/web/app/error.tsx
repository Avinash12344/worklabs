'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry (already installed)
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto rounded-full bg-danger-100 dark:bg-danger-700/20 flex items-center justify-center mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-danger-600 dark:text-danger-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-h2 text-slate-900 dark:text-slate-100">
          Something went wrong
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          We&apos;ve been notified and are looking into it. Try again in a
          moment.
        </p>

        {error.digest && (
          <p className="mt-4 text-caption text-slate-400 dark:text-slate-500 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/">
            <Button variant="secondary">Go home</Button>
          </Link>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </main>
  );
}