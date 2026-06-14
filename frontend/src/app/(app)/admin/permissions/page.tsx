'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Permission } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Permission[]>('/permissions')
      .then(setPermissions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-orange-600 hover:underline">&larr; Administration</Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 mt-1">Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">{permissions.length} permissions</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 font-mono text-xs font-medium text-slate-900">{p.code}</td>
                <td className="px-5 py-4 text-slate-600">{p.description || '-'}</td>
              </tr>
            ))}
            {permissions.length === 0 && (
              <tr><td colSpan={2} className="px-5 py-8 text-center text-slate-500">No permissions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
