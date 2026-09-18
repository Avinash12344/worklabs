'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from '@/components/notification-bell';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { MobileMenu } from './mobile-menu';

type NavItem = { href: string; label: string; requiresAuth?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/search', label: 'Search' },
  { href: '/contracts', label: 'Contracts', requiresAuth: true },
];

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo + desktop nav */}
        <div className="flex items-center gap-8">
          <Logo />

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.filter((item) => !item.requiresAuth || user).map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3 py-2 rounded-md text-bodySm font-medium transition-colors
                    ${
                      isActive
                        ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}

          {user ? (
            <Dropdown
              trigger={
                <button
                  className="w-9 h-9 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center hover:bg-brand-700 transition-colors"
                  aria-label="User menu"
                >
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
              <Link href="/dashboard">
                <DropdownItem>Dashboard</DropdownItem>
              </Link>
              <Link href="/proposals">
                <DropdownItem>My Proposals</DropdownItem>
              </Link>
              <Link href="/jobs/mine">
                <DropdownItem>My Jobs</DropdownItem>
              </Link>
              <Link href="/settings/profile">
                <DropdownItem>Settings</DropdownItem>
              </Link>
              {user.role === 'freelancer' && (
                <Link href="/settings/payments">
                  <DropdownItem>Payments</DropdownItem>
                </Link>
              )}
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
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}