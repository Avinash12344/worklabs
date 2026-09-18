'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from '@/components/notification-bell';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown';

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
            {user ? (
  <>
    <Link href="/dashboard" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
      Dashboard
    </Link>
    <Dropdown
      trigger={
        <button className="w-9 h-9 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center hover:bg-brand-700 transition-colors">
          {user.full_name.charAt(0).toUpperCase()}
        </button>
      }
    >
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="text-bodySm font-medium text-slate-900 dark:text-slate-100 truncate">
          {user.full_name}
        </div>
        <div className="text-caption text-slate-500 dark:text-slate-400 truncate">
          {user.email}
        </div>
      </div>

      <Link href={`/users/${user.id}`}>
        <DropdownItem>Profile</DropdownItem>
      </Link>
      <Link href="/settings/profile">
        <DropdownItem>Settings</DropdownItem>
      </Link>
      {user.role === 'freelancer'}
        <Link href="/settings/payments">
          <DropdownItem>Payments</DropdownItem>
        </Link>
        <Link href="/settings/jobs">
          <DropdownItem>Jobs</DropdownItem>
        </Link>
        <Link href="/settings/contracts">
          <DropdownItem>Contracts</DropdownItem>
        </Link>

      {user.role === 'admin' && (
        <Link href="/admin">
          <DropdownItem>Admin</DropdownItem>
        </Link>
      )}

      <DropdownDivider />

      <DropdownItem danger onClick={logout}>
        Log out
      </DropdownItem>
    </Dropdown>
  </>
) : (
  // Existing login/signup buttons

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