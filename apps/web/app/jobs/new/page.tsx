'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createJobSchema } from '@worklabs/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FieldErrors = Partial<Record<string, string[]>>;

export default function NewJobPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState<string>('');
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const payload = {
      title,
      description,
      budget_min: Number(budgetMin) * 100,  // rupees → paise
      budget_max: Number(budgetMax) * 100,
    };

    // Client-side validation using the SAME schema the backend uses
    const parsed = createJobSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as FieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.details) setErrors(err.details);
        throw new Error(err.error || 'Failed to create job');
      }

      router.push('/jobs');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // Not logged in? Redirect
  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  if (user && user.role !== 'client') {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 border border-slate-200 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Only clients can post jobs
          </h1>
          <p className="mt-2 text-slate-600">
            Your account is a <strong>{user.role}</strong>.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-block px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700"
          >
            Browse jobs instead
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Post a new job</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 space-y-4"
        >
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {serverError}
            </div>
          )}

          <Field
            label="Title"
            value={title}
            onChange={setTitle}
            errors={errors.title}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Budget min (₹)
              </label>
              <input
                type="number"
                min="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
              />
              {errors.budget_min && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_min[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Budget max (₹)
              </label>
              <input
                type="number"
                min="0"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
              />
              {errors.budget_max && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_max[0]}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Posting...' : 'Post job'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  errors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  errors?: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
      />
      {errors && <p className="mt-1 text-sm text-red-600">{errors[0]}</p>}
    </div>
  );
}