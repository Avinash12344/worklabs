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

async function getJobs(): Promise<Job[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/jobs`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch jobs');
  }

  const data = await res.json();
  return data.jobs;
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Open Jobs</h1>

        {jobs.length === 0 ? (
          <p className="text-slate-600">No open jobs yet.</p>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-slate-200"
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
                  <span>•</span>
                  <span>by {job.client.full_name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}