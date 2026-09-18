import { ReactNode } from 'react';

export function MarketingPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-h1 text-slate-900 dark:text-slate-100 mb-8">
        {title}
      </h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {children}
      </div>
    </main>
  );
}