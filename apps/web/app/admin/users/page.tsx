'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AdminUser = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  created_at: string;
  banned_at: string | null;
  banned_reason: string | null;
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function submitFilter(e: FormEvent) {
    e.preventDefault();
    load();
  }

  async function toggleBan(user: AdminUser) {
    if (!confirm(user.banned_at ? `Unban ${user.full_name}?` : `Ban ${user.full_name}?`)) return;

    setActionLoading(user.id);
    try {
      const action = user.banned_at ? 'unban' : 'ban';
      const body = action === 'ban' ? JSON.stringify({ reason: 'Admin action' }) : undefined;
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Action failed');
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Users</h1>

      <form onSubmit={submitFilter} className="flex gap-3 mb-4">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or name…"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="freelancer">Freelancers</option>
          <option value="admin">Admins</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 text-sm">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500">No users found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/users/${u.id}`} className="text-slate-900 hover:underline">
                      {u.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase tracking-wide text-slate-500">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.banned_at ? (
                      <span className="text-xs text-red-600 font-medium">BANNED</span>
                    ) : (
                      <span className="text-xs text-green-600">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={actionLoading === u.id}
                      className={`px-3 py-1 text-xs rounded ${
                        u.banned_at
                          ? 'border border-slate-300 hover:bg-slate-100'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      } disabled:opacity-50`}
                    >
                      {actionLoading === u.id ? '…' : u.banned_at ? 'Unban' : 'Ban'}
                    </button>
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