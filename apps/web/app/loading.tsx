export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-600 border-r-transparent animate-spin" />
        <p className="text-bodySm text-slate-500 dark:text-slate-400">
          Loading…
        </p>
      </div>
    </div>
  );
}