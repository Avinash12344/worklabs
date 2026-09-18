import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-brand-600 dark:text-brand-400 mb-4">
          404
        </div>
        <h1 className="text-h2 text-slate-900 dark:text-slate-100">
          Page not found
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/">
            <Button variant="secondary">Go home</Button>
          </Link>
          <Link href="/jobs">
            <Button>Browse jobs</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}