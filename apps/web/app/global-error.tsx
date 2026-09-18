'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-slate-900">
              Something went very wrong
            </h1>
            <p className="mt-3 text-slate-600">
              The application failed to load. Please refresh or try again
              later.
            </p>

            {error.digest && (
              <p className="mt-4 text-xs text-slate-400 font-mono">
                Error ID: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              className="mt-8 px-5 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}