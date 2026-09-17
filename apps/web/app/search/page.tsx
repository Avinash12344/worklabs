import Link from 'next/link';
import { JobSearch } from '@/components/job-search';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Job = {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  location: string | null;
  client: { id: string; full_name: string; avatar_url: string | null };
};

async function searchJobs(params: {
  q?: string;
  min_budget?: string;
  max_budget?: string;
}) {
  const url = new URL(`${API_URL}/api/jobs/search`);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.min_budget) url.searchParams.set('min_budget', params.min_budget);
  if (params.max_budget) url.searchParams.set('max_budget', params.max_budget);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Search failed');
  return res.json() as Promise<{ jobs: Job[]; count: number }>;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; min_budget?: string; max_budget?: string }>;
}) {
  const params = await searchParams;
  const { jobs, count } = await searchJobs(params);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Search Jobs</h1>

        <JobSearch />

        <div className="mt-6">
          {params.q && (
            <p className="text-sm text-slate-500 mb-4">
              {count} result{count !== 1 ? 's' : ''} for &ldquo;{params.q}&rdquo;
            </p>
          )}

          {jobs.length === 0 ? (
            <p className="text-slate-600">No jobs match your search.</p>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block bg-white rounded-lg shadow-sm p-6 border border-slate-200 hover:shadow-md transition"
                  >
                    <h2 className="text-xl font-semibold text-slate-900">
                      {job.title}
                    </h2>
                    <p className="mt-2 text-slate-600 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                      <span>
                        ₹{(job.budget_min / 100).toLocaleString()} – ₹
                        {(job.budget_max / 100).toLocaleString()}
                      </span>
                      {job.location && (
                        <>
                          <span>•</span>
                          <span>📍 {job.location}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>by {job.client.full_name}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}