'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';

type NavItem = { href: string; label: string; requiresAuth?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/search', label: 'Search' },
  { href: '/contracts', label: 'Contracts', requiresAuth: true },
  { href: '/proposals', label: 'My Proposals', requiresAuth: true },
  { href: '/jobs/mine', label: 'My Jobs', requiresAuth: true },
];

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on navigation
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative h-full w-[80vw] max-w-sm bg-white dark:bg-slate-900 shadow-dropdown flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <Logo />
          <button
            onClick={onClose}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.filter((item) => !item.requiresAuth || user).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block px-4 py-3 rounded-md text-body font-medium transition-colors
                  ${
                    isActive
                      ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/20'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {user ? (
            <>
              <Link href={`/users/${user.id}`} onClick={onClose}>
                <Button variant="secondary" fullWidth>
                  View profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose}>
                <Button variant="secondary" fullWidth>
                  Log in
                </Button>
              </Link>
              <Link href="/signup" onClick={onClose}>
                <Button fullWidth>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}