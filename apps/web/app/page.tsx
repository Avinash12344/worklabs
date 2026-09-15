'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, loading, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">
            WorkLabs
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/jobs" className="text-slate-700 hover:text-slate-900">
              Jobs
            </Link>
            {user && (
  <Link href="/contracts" className="text-slate-700 hover:text-slate-900">
    Contracts
  </Link>
)}
            {loading ? null : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-700 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-slate-700 hover:text-slate-900"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-700 hover:text-slate-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-slate-900">
          WorkLabs
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          A modern freelance marketplace. Coming soon.
        </p>
        <Link
          href="/jobs"
          className="mt-8 inline-block px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition"
        >
          Browse Jobs →
        </Link>
      </div>
    </main>
  );
}