'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Contract = {
  id: string;
  total_amount: number;
  status: string;
  started_at: string;
  job: { id: string; title: string; description: string };
  proposal: { id: string; cover_letter: string };
  client: { id: string; full_name: string };
  freelancer: { id: string; full_name: string };
};

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id;
  const { user, token, loading } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !token) return;

    async function fetchContract() {
      const res = await fetch(`${API_URL}/api/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Failed to load');
        return;
      }
      const data = await res.json();
      setContract(data.contract);
    }
    fetchContract();
  }, [contractId, token, loading]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Link href="/login" className="text-slate-900 underline">
          Log in
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/contracts" className="mt-4 inline-block text-slate-900 underline">
            Back to contracts
          </Link>
        </div>
      </main>
    );
  }

  if (!contract) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/contracts" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to contracts
        </Link>

        <div className="mt-4 bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{contract.job.title}</h1>
            <span className="text-sm uppercase tracking-wide text-slate-500">
              {contract.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Client</div>
              <div className="text-slate-900 font-medium">
                {contract.client.full_name}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Freelancer</div>
              <div className="text-slate-900 font-medium">
                {contract.freelancer.full_name}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-sm text-slate-500">Total amount</div>
            <div className="text-3xl font-bold text-slate-900">
              ₹{(contract.total_amount / 100).toLocaleString()}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Job description</h2>
            <p className="mt-2 text-slate-700 whitespace-pre-wrap">
              {contract.job.description}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Original proposal</h2>
            <p className="mt-2 text-slate-700 whitespace-pre-wrap">
              {contract.proposal.cover_letter}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}