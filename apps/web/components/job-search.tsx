'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function JobSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [minBudget, setMinBudget] = useState(searchParams.get('min_budget') ?? '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('max_budget') ?? '');

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (minBudget) params.set('min_budget', String(Number(minBudget) * 100));
    if (maxBudget) params.set('max_budget', String(Number(maxBudget) * 100));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-end"
    >
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Search
        </label>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="React, design, API…"
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <div className="w-32">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Min ₹
        </label>
        <input
          type="number"
          min="0"
          value={minBudget}
          onChange={(e) => setMinBudget(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <div className="w-32">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Max ₹
        </label>
        <input
          type="number"
          min="0"
          value={maxBudget}
          onChange={(e) => setMaxBudget(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 text-sm"
      >
        Search
      </button>
    </form>
  );
}