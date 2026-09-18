'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ReviewSection } from '@/components/review-form';
import { ContractChat } from '@/components/contract-chat';
import { track } from '@/lib/analytics';
import { showError } from '@/lib/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  order_index: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type Contract = {
  id: string;
  total_amount: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  job: { id: string; title: string; description: string };
  proposal: { id: string; cover_letter: string };
  client: { id: string; full_name: string };
  freelancer: { id: string; full_name: string };
  milestones: Milestone[];
};

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id;
  const { user, token, loading } = useAuth();

  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Milestone create form state
  const [newMsTitle, setNewMsTitle] = useState('');
  const [newMsDesc, setNewMsDesc] = useState('');
  const [newMsAmount, setNewMsAmount] = useState('');
  const [msError, setMsError] = useState<string | null>(null);
  const [creatingMs, setCreatingMs] = useState(false);

const [refreshKey, setRefreshKey] = useState(0);

const fetchContract = useCallback(async () => {
    if (!token) return;
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
  }, [contractId, token]);

  useEffect(() => {
    if (loading || !token) return;
    fetchContract();
  }, [loading, token, fetchContract]);

 // ─── Milestone actions ───
  async function milestoneAction(
    milestoneId: string,
    action: 'start' | 'submit' | 'approve' | 'reject'
  ) {
    setActionLoading(`${milestoneId}:${action}`);
    try {
      const res = await fetch(`${API_URL}/api/milestones/${milestoneId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${action}`);
      }

      await fetchContract();
      track('milestone_action', { milestone_id: milestoneId, action });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoading(null);
    }
  }

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
  }, [contractId, token, loading, refreshKey]);

  // ─── Create milestone ───
  async function handleCreateMilestone(e: FormEvent) {
    e.preventDefault();
    setMsError(null);
    setCreatingMs(true);

    try {
      const res = await fetch(
        `${API_URL}/api/contracts/${contractId}/milestones`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newMsTitle,
            description: newMsDesc || undefined,
            amount: Number(newMsAmount) * 100,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create milestone');
      }

      setNewMsTitle('');
      setNewMsDesc('');
      setNewMsAmount('');
      await fetchContract();
    } catch (err) {
      setMsError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCreatingMs(false);
    }
  }


  // ─── Guards — before touching user.id / contract.id ───
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
          Log in to view this contract
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
        <p className="text-slate-600">Loading contract…</p>
      </main>
    );
  }

  // ─── Derived ───
  const isClient = user.id === contract.client.id;
  const isFreelancer = user.id === contract.freelancer.id;

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
      <div className="mt-6 pt-6 border-t border-slate-200">
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold text-slate-900">
      Milestones ({contract.milestones.length})
    </h2>
    {isClient && contract.status === 'active' && (
      <span className="text-xs text-slate-500">
        Total: ₹{(contract.milestones.reduce((s, m) => s + m.amount, 0) / 100).toLocaleString()} / ₹{(contract.total_amount / 100).toLocaleString()}
      </span>
    )}
  </div>

  <div className="mt-6">
  <ContractChat contractId={contractId} />
</div>

  {contract.milestones.length === 0 ? (
    <p className="mt-3 text-sm text-slate-600">No milestones yet.</p>
  ) : (
    <ul className="mt-3 space-y-3">
      {[...contract.milestones]
        .sort((a, b) => a.order_index - b.order_index)
        .map((m) => (
          <li key={m.id} className="border border-slate-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-900">{m.title}</div>
              <div className="font-semibold text-slate-900">
                ₹{(m.amount / 100).toLocaleString()}
              </div>
            </div>

            {m.description && (
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                {m.description}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs uppercase tracking-wide ${
                m.status === 'approved' ? 'text-green-600' :
                m.status === 'submitted' ? 'text-blue-600' :
                m.status === 'rejected' ? 'text-red-600' :
                m.status === 'in_progress' ? 'text-amber-600' :
                'text-slate-500'
              }`}>
                {m.status.replace('_', ' ')}
              </span>

              <div className="flex gap-2">
                {isFreelancer && m.status === 'pending' && (
                  <button onClick={() => milestoneAction(m.id, 'start')}
                    disabled={actionLoading === `${m.id}:start`}
                    className="px-3 py-1 text-xs bg-slate-900 text-white rounded hover:bg-slate-700 disabled:opacity-50">
                    {actionLoading === `${m.id}:start` ? '...' : 'Start'}
                  </button>
                )}
                {isFreelancer && (m.status === 'in_progress' || m.status === 'rejected') && (
                  <button onClick={() => milestoneAction(m.id, 'submit')}
                    disabled={actionLoading === `${m.id}:submit`}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                    {actionLoading === `${m.id}:submit` ? '...' : 'Submit for review'}
                  </button>
                )}
                {isClient && m.status === 'submitted' && (
                  <>
                    <button onClick={() => milestoneAction(m.id, 'reject')}
                      disabled={actionLoading === `${m.id}:reject`}
                      className="px-3 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50">
                      Reject
                    </button>
                    <button onClick={() => milestoneAction(m.id, 'approve')}
                      disabled={actionLoading === `${m.id}:approve`}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                      {actionLoading === `${m.id}:approve` ? '...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
    </ul>
  )}

  {/* Client: create milestone form (only if contract is active) */}
  {isClient && contract.status === 'active' && (
    <form onSubmit={handleCreateMilestone} className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200 space-y-3">
      <div className="text-sm font-medium text-slate-900">Add milestone</div>

      {msError && (
        <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {msError}
        </div>
      )}

      <input
        type="text"
        placeholder="Title"
        required
        value={newMsTitle}
        onChange={(e) => setNewMsTitle(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
      />
      <textarea
        placeholder="Description (optional)"
        rows={2}
        value={newMsDesc}
        onChange={(e) => setNewMsDesc(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Amount (₹)"
          required
          min="0"
          value={newMsAmount}
          onChange={(e) => setNewMsAmount(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md"
        />
        <button
          type="submit"
          disabled={creatingMs}
          className="px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
        >
          {creatingMs ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  )}
  {contract.status === 'completed' && (
  <ReviewSection contractId={contractId} />
)}
</div>
    </main>
  );
}