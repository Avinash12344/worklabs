'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Stats = {
  users: { total: number; clients: number; freelancers: number; admins: number; banned: number };
  jobs: { total: number; open: number; in_progress: number };
  contracts: { total: number; active: number; completed: number; disputed: number };
  money: { gross_volume_paise: number; released_paise: number };
  activity: { proposals: number; reviews: number };
};

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    async function load() {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading || !stats) {
    return <p className="text-slate-500">Loading stats…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Overview</h1>

      <Section title="Users">
        <Stat label="Total" value={stats.users.total} />
        <Stat label="Clients" value={stats.users.clients} />
        <Stat label="Freelancers" value={stats.users.freelancers} />
        <Stat label="Admins" value={stats.users.admins} />
        <Stat label="Banned" value={stats.users.banned} variant="warn" />
      </Section>

      <Section title="Jobs">
        <Stat label="Total" value={stats.jobs.total} />
        <Stat label="Open" value={stats.jobs.open} variant="good" />
        <Stat label="In Progress" value={stats.jobs.in_progress} />
      </Section>

      <Section title="Contracts">
        <Stat label="Total" value={stats.contracts.total} />
        <Stat label="Active" value={stats.contracts.active} />
        <Stat label="Completed" value={stats.contracts.completed} variant="good" />
        <Stat label="Disputed" value={stats.contracts.disputed} variant="warn" />
      </Section>

      <Section title="Money">
        <Stat
          label="Gross Volume"
          value={`₹${(stats.money.gross_volume_paise / 100).toLocaleString()}`}
        />
        <Stat
          label="Released to Freelancers"
          value={`₹${(stats.money.released_paise / 100).toLocaleString()}`}
          variant="good"
        />
      </Section>

      <Section title="Activity">
        <Stat label="Proposals" value={stats.activity.proposals} />
        <Stat label="Reviews" value={stats.activity.reviews} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number | string;
  variant?: 'default' | 'good' | 'warn';
}) {
  const colors = {
    default: 'text-slate-900',
    good: 'text-green-600',
    warn: 'text-amber-600',
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${colors[variant]}`}>{value}</div>
    </div>
  );
}