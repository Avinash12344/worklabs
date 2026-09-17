'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-2xl font-bold text-slate-900">
            Admin
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="text-slate-700 hover:text-slate-900">
              Overview
            </Link>
            <Link href="/admin/users" className="text-slate-700 hover:text-slate-900">
              Users
            </Link>
            <Link href="/admin/contracts" className="text-slate-700 hover:text-slate-900">
              Contracts
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </main>
  );
}