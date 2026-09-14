import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">WorkLabs</h1>
        <p className="mt-4 text-slate-600">
          A modern freelance marketplace. Coming soon.
        </p>
        <Link
          href="/jobs"
          className="mt-6 inline-block px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition"
        >
          Browse Jobs →
        </Link>
      </div>
    </main>
  );
}