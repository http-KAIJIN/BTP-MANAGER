'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Sale, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

export default function SalesPage() {
  const [data, setData] = useState<PaginatedResponse<Sale> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get<PaginatedResponse<Sale>>('/real-estate/sales')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/real-estate/sales/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
  };

  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { EN_COURS: 'bg-yellow-100 text-yellow-700', TERMINE: 'bg-green-100 text-green-700', ANNULE: 'bg-red-100 text-red-700' };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m[s] || 'bg-slate-100 text-slate-700'}`}>{s === 'EN_COURS' ? 'In Progress' : s === 'TERMINE' ? 'Completed' : s === 'ANNULE' ? 'Cancelled' : s}</span>;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Sales</h1>
          <p className="mt-1 text-sm text-slate-500">{data?.meta.total ?? 0} sales</p>
        </div>
        <Link href="/sales/new" className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">New Sale</Link>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Sale Price (MAD)</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium"><Link href={`/sales/${s.id}`} className="text-orange-600 hover:underline">{s.client?.name || '-'}</Link></td>
                  <td className="px-5 py-4 text-slate-600">{s.property?.reference || '-'}</td>
                  <td className="px-5 py-4 text-slate-600">{Number(s.salePrice).toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-600">{new Date(s.saleDate).toLocaleDateString()}</td>
                  <td className="px-5 py-4">{statusBadge(s.status)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link href={`/sales/${s.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">View</Link>
                      <Link href={`/sales/${s.id}/edit`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Edit</Link>
                      <button onClick={() => setDeleteId(s.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No sales found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
