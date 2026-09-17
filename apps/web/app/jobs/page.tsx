import Link from "next/link";
import {JobsFilter} from "../../components/jobs-filter.jsx"

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
  location: string | null;
  latitude: number | null;
  longitude: number | null;
};

async function getJobs(searchParams: {
  lat?: string;
  lng?: string;
  radius_km?: string;
}): Promise<Job[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const params = new URLSearchParams();
  if (searchParams.lat) params.set('lat', searchParams.lat);
  if (searchParams.lng) params.set('lng', searchParams.lng);
  if (searchParams.radius_km) params.set('radius_km', searchParams.radius_km);

  const url = `${apiUrl}/api/jobs${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  const data = await res.json();
  return data.jobs;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; radius_km?: string }>;
}) {
  const params = await searchParams;
  const jobs = await getJobs(params);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-slate-900">Open Jobs</h1>
          <Link
            href="/jobs/new"
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700"
          >
            Post a Job
          </Link>
        </div>

        <div className="mb-6">
          <JobsFilter />
        </div>

        {jobs.length === 0 ? (
          <p className="text-slate-600">No open jobs match your filter.</p>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block bg-white rounded-lg shadow-sm p-6 border border-slate-200 hover:shadow-md transition"
                >
                  <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                  <p className="mt-2 text-slate-600 line-clamp-2">{job.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                    <span>₹{(job.budget_min / 100).toLocaleString()} – ₹{(job.budget_max / 100).toLocaleString()}</span>
                    {job.location && (<><span>•</span><span>📍 {job.location}</span></>)}
                    {(job as any).distance_km !== undefined && (
                      <><span>•</span><span>{((job as any).distance_km).toFixed(1)} km away</span></>
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
    </main>
  );
}