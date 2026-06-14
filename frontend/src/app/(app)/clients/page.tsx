'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Client, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

export default function ClientsPage() {
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get<PaginatedResponse<Client>>('/clients', { search: search || undefined })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/clients/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
  };

  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">{data?.meta.total ?? 0} clients</p>
        </div>
        <Link href="/clients/new" className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">New Client</Link>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">CIN</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium"><Link href={`/clients/${c.id}`} className="text-orange-600 hover:underline">{c.name}</Link></td>
                  <td className="px-5 py-4 text-slate-600">{c.phone || '-'}</td>
                  <td className="px-5 py-4 text-slate-600">{c.cin || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link href={`/clients/${c.id}/edit`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Edit</Link>
                      <button onClick={() => setDeleteId(c.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
