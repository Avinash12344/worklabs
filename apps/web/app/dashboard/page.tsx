'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';


export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-100"
          >
            Log out
          </button>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Welcome, {user.full_name}
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd className="text-slate-900 capitalize">{user.role}</dd>
            </div>
            <div>
              <dt className="text-slate-500">User ID</dt>
              <dd className="text-slate-900 font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}