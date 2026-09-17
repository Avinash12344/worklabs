'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AdminContract = {
  id: string;
  total_amount: number;
  status: string;
  started_at: string;
  job: { id: string; title: string };
  client: { id: string; full_name: string; email: string };
  freelancer: { id: string; full_name: string; email: string };
};

export default function AdminContractsPage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await fetch(`${API_URL}/api/admin/contracts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts);
      }
      setLoading(false);
    }
    load();
  }, [token, status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Contracts</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="disputed">Disputed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : contracts.length === 0 ? (
        <p className="text-slate-500">No contracts.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Job</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Client</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Freelancer</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Amount</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/contracts/${c.id}`} className="text-slate-900 hover:underline">
                      {c.job.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.client.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.freelancer.full_name}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-medium">
                    ₹{(c.total_amount / 100).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs uppercase tracking-wide ${
                        c.status === 'completed'
                          ? 'text-green-600'
                          : c.status === 'disputed'
                          ? 'text-red-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}