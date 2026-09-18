'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { showError } from '@/lib/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Status = {
  connected: boolean;
  onboarding_complete: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
};

export default function PaymentsSettingsPage() {
  const { user, token, loading } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [fetching, setFetching] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || !token) return;

    async function fetchStatus() {
      const res = await fetch(`${API_URL}/api/connect/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStatus(await res.json());
      setFetching(false);
    }
    fetchStatus();
  }, [token, loading]);

  async function handleOnboard() {
    setRedirecting(true);
    try {
      const res = await fetch(`${API_URL}/api/connect/onboard`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start onboarding');
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Something went wrong');
      setRedirecting(false);
    }
  }

  if (loading || fetching) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p>Log in to configure payments.</p>
      </main>
    );
  }

  if (user.role !== 'freelancer') {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p>Only freelancers need payment setup.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Payment Settings</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          {status?.onboarding_complete ? (
            <>
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-xl">✓</span>
                <span className="font-semibold">Payments are set up</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                You can receive money from clients directly to your bank account.
              </p>
            </>
          ) : status?.connected ? (
            <>
              <div className="flex items-center gap-2 text-amber-700">
                <span className="text-xl">⚠</span>
                <span className="font-semibold">Onboarding incomplete</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                You started setup but didn't finish. Continue to receive payments.
              </p>
              <button
                onClick={handleOnboard}
                disabled={redirecting}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
              >
                {redirecting ? 'Redirecting...' : 'Continue setup'}
              </button>
            </>
          ) : (
            <>
              <div className="font-semibold text-slate-900">
                Set up payments to get paid
              </div>
              <p className="mt-2 text-sm text-slate-600">
                We use Stripe to send money to your bank. Takes about 2 minutes.
              </p>
              <button
                onClick={handleOnboard}
                disabled={redirecting}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
              >
                {redirecting ? 'Redirecting...' : 'Set up payments with Stripe'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}