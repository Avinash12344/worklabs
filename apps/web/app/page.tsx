'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-display text-slate-900 dark:text-slate-100">
          WorkLabs
        </h1>
        <p className="mt-6 text-h4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Where great work meets great talent. Post a job, hire a
          freelancer, or start your next project — all in one place.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link href="/jobs">
            <Button size="lg">Browse Jobs</Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="lg" variant="secondary">
              Post a Job
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}