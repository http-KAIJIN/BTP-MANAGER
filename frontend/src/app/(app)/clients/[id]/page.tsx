'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Client } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

interface FinancialSummary {
  clientId: string;
  totalProjects: number;
  totalPayments: number;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Client>(`/clients/${id}`),
      api.get<FinancialSummary>(`/clients/${id}/financial-summary`),
    ])
      .then(([c, f]) => { setClient(c); setFinancial(f); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clients/${id}`);
      router.push('/clients');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!client) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/clients" className="text-sm text-orange-600 hover:underline">&larr; Clients</Link>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{client.name}</h1>
        </div>
        <div className="flex gap-3">
          <Link href={`/clients/${id}/edit`} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Edit</Link>
          <button onClick={() => setShowDelete(true)} className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Client Info</h2>
          <dl className="space-y-3">
            {[
              ['Phone', client.phone],
              ['CIN', client.cin],
              ['Address', client.address],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">{value || '-'}</dd>
              </div>
            ))}
          </dl>
          {client.notes && (
            <div className="mt-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{client.notes}</dd>
            </div>
          )}
        </div>

        {financial && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Financial Summary</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Projects</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">{financial.totalProjects}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Payments</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">{financial.totalPayments.toLocaleString()} MAD</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {client.projects && client.projects.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Projects</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium"><Link href={`/projects/${p.id}`} className="text-orange-600 hover:underline">{p.name}</Link></td>
                  <td className="px-5 py-4 text-slate-600">{p.city}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteModal open={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting}
        message="Are you sure you want to archive this client?" />
    </div>
  );
}
