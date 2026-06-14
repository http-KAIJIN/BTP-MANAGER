'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { User, Role, Permission } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<User[]>('/users'),
      api.get<Role[]>('/roles'),
      api.get<Permission[]>('/permissions'),
    ]).then(([u, r, p]) => {
      setUsers(u);
      setRoles(r);
      setPermissions(p);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-8">Administration</h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Link href="/admin/users" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-orange-300 transition-colors">
          <div className="text-3xl font-bold text-slate-950">{users.length}</div>
          <div className="mt-1 text-sm font-medium text-slate-500">Users</div>
          <div className="mt-2 text-sm text-orange-600">Manage users &rarr;</div>
        </Link>
        <Link href="/admin/roles" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-orange-300 transition-colors">
          <div className="text-3xl font-bold text-slate-950">{roles.length}</div>
          <div className="mt-1 text-sm font-medium text-slate-500">Roles</div>
          <div className="mt-2 text-sm text-orange-600">View roles &rarr;</div>
        </Link>
        <Link href="/admin/permissions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-orange-300 transition-colors">
          <div className="text-3xl font-bold text-slate-950">{permissions.length}</div>
          <div className="mt-1 text-sm font-medium text-slate-500">Permissions</div>
          <div className="mt-2 text-sm text-orange-600">View permissions &rarr;</div>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Users</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.slice(0, 5).map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.roles.map(r => r.name).join(', ')}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
