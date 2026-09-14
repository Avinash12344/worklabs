'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer'>('freelancer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Signup failed');
      }

      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg shadow-sm p-8 border border-slate-200"
      >
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            I am a
          </label>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setRole('freelancer')}
              className={`flex-1 py-2 rounded-md border ${
                role === 'freelancer'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Freelancer
            </button>
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`flex-1 py-2 rounded-md border ${
                role === 'client'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Client
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 transition"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="text-slate-900 underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}