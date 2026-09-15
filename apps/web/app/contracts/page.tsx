'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Contract = {
  id: string;
  total_amount: number;
  status: string;
  started_at: string;
  job: { id: string; title: string };
  client: { id: string; full_name: string };
  freelancer: { id: string; full_name: string };
};

export default function ContractsPage() {
  const { user, token, loading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      setFetching(false);
      return;
    }

    async function fetchContracts() {
      const res = await fetch(`${API_URL}/api/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts);
      }
      setFetching(false);
    }
    fetchContracts();
  }, [user, token, loading]);

  if (fetching) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-700">
          <Link href="/login" className="text-slate-900 underline">
            Log in
          </Link>{' '}
          to see your contracts.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">My Contracts</h1>

        {contracts.length === 0 ? (
          <p className="text-slate-600">No contracts yet.</p>
        ) : (
          <ul className="space-y-4">
            {contracts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contracts/${c.id}`}
                  className="block bg-white rounded-lg shadow-sm p-6 border border-slate-200 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {c.job.title}
                    </h2>
                    <span className="text-lg font-semibold text-slate-900">
                      ₹{(c.total_amount / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {c.client.full_name} ↔ {c.freelancer.full_name}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                    {c.status}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}