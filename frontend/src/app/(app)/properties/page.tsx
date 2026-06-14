'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Property, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

export default function PropertiesPage() {
  const [data, setData] = useState<PaginatedResponse<Property> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get<PaginatedResponse<Property>>('/real-estate/properties')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/real-estate/properties/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
  };

  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  const typeLabel = (t: string) => ({ APPARTEMENT: 'Apartment', LOCAL_COMMERCIAL: 'Local Commercial', BUREAU: 'Office', ENTREPOT: 'Warehouse' })[t] || t;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">{data?.meta.total ?? 0} properties</p>
        </div>
        <Link href="/properties/new" className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">New Property</Link>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Surface (m²)</th>
                <th className="px-5 py-3">Price (MAD)</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium"><Link href={`/properties/${p.id}`} className="text-orange-600 hover:underline">{p.reference}</Link></td>
                  <td className="px-5 py-4 text-slate-600">{typeLabel(p.type)}</td>
                  <td className="px-5 py-4 text-slate-600">{Number(p.surface)}</td>
                  <td className="px-5 py-4 text-slate-600">{Number(p.price).toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-600">{p.project?.name || '-'}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === 'DISPONIBLE' ? 'bg-green-100 text-green-700' : p.status === 'RESERVE' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{p.status}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link href={`/properties/${p.id}/edit`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Edit</Link>
                      <button onClick={() => setDeleteId(p.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No properties found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
