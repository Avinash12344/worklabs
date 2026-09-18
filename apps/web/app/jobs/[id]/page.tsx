'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createProposalSchema } from '@worklabs/shared';
import { track } from '@/lib/analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Job = {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  client: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
};

type Proposal = {
  id: string;
  cover_letter: string;
  bid_amount: number;
  status: string;
  created_at: string;
  freelancer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [fetching, setFetching] = useState(true);

  // Proposal form state
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const [accepting, setAccepting] = useState<string | null>(null);

async function handleAccept(proposalId: string) {
  if (!confirm('Accept this proposal? Other proposals will be rejected.')) return;

  setAccepting(proposalId);
  try {
    const res = await fetch(`${API_URL}/api/proposals/${proposalId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept');
    }

    const data = await res.json();
    router.push(`/contracts/${data.contract_id}`);
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Something went wrong');
  } finally {
    setAccepting(null);
  }
}

  // Fetch job
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load job');
        }
        const data = await res.json();
        setJob(data.job);
      } catch (err) {
        setJobError(err instanceof Error ? err.message : 'Error loading job');
      } finally {
        setFetching(false);
      }
    }
    if (jobId) fetchJob();
  }, [jobId]);

  // Fetch proposals if current user is the job's client
  useEffect(() => {
    if (!job || !user || !token) return;
    if (job.client.id !== user.id) return;

    async function fetchProposals() {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/proposals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals);
      }
    }
    fetchProposals();
  }, [job, user, token, jobId]);

  async function handleSubmitProposal(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = {
      job_id: jobId,
      cover_letter: coverLetter,
      bid_amount: Number(bidAmount) * 100,
    };

    const parsed = createProposalSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.details) setFieldErrors(err.details);
        throw new Error(err.error || 'Failed to submit proposal');
      }

      router.push('/dashboard');
      track('proposal_submitted', { job_id: jobId, bid_amount: bidAmount });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (jobError || !job) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{jobError || 'Job not found'}</p>
          <Link href="/jobs" className="mt-4 inline-block text-slate-900 underline">
            Back to jobs
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = user?.id === job.client.id;
  const isFreelancer = user?.role === 'freelancer';
  const canApply = isFreelancer && !isOwner && job.status === 'open';

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/jobs"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back to jobs
        </Link>

        <div className="mt-4 bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>

          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
            <span>Posted by {job.client.full_name}</span>
            <span>•</span>
            <span>{new Date(job.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span className="uppercase tracking-wide">{job.status}</span>
          </div>

          <div className="mt-4 text-slate-700 whitespace-pre-wrap">
            {job.description}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Budget</div>
              <div className="text-lg font-semibold text-slate-900">
                ₹{(job.budget_min / 100).toLocaleString()} – ₹
                {(job.budget_max / 100).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Freelancer: apply form */}
        {canApply && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              Submit a proposal
            </h2>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Cover letter
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Tell the client why you're a great fit..."
                />
                {fieldErrors.cover_letter && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.cover_letter[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Your bid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                />
                {fieldErrors.bid_amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.bid_amount[0]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit proposal'}
              </button>
            </form>
          </div>
        )}

        {/* Not logged in: prompt */}
        {!loading && !user && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-slate-200 text-center">
            <p className="text-slate-700">
              <Link href="/login" className="text-slate-900 underline">
                Log in
              </Link>{' '}
              as a freelancer to submit a proposal.
            </p>
          </div>
        )}

        {/* Client: proposals list */}
        {isOwner && (
            
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              Proposals ({proposals.length})
            </h2>

            {proposals.length === 0 ? (
              <p className="mt-4 text-slate-600">No proposals yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {proposals.map((p) => (
  <li key={p.id} className="border border-slate-200 rounded-md p-4">
    <div className="flex items-center justify-between">
      <div className="font-medium text-slate-900">
        {p.freelancer.full_name}
      </div>
      <div className="text-slate-900 font-semibold">
        ₹{(p.bid_amount / 100).toLocaleString()}
      </div>
    </div>
    <p className="mt-2 text-slate-700 whitespace-pre-wrap text-sm">
      {p.cover_letter}
    </p>

    <div className="mt-3 flex items-center justify-between">
      <span
        className={`text-xs uppercase tracking-wide ${
          p.status === 'pending' ? 'text-amber-600' :
          p.status === 'accepted' ? 'text-green-600' : 'text-slate-500'
        }`}
      >
        {p.status}
      </span>

      {p.status === 'pending' && job.status === 'open' && (
        <button
          onClick={() => handleAccept(p.id)}
          disabled={accepting === p.id}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {accepting === p.id ? 'Accepting...' : 'Accept'}
        </button>
      )}
    </div>
  </li>
))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}