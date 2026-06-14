'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Supplier, FinancialSummary } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

function formatMAD(amount: number) {
  return amount.toLocaleString('fr-FR') + ' MAD';
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Supplier>(`/suppliers/${id}`),
      api.get<FinancialSummary>(`/suppliers/${id}/financial-summary`),
    ])
      .then(([s, f]) => { setSupplier(s); setFinancial(f); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/suppliers/${id}`);
      router.push('/suppliers');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!supplier) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/suppliers" className="text-sm text-orange-600 hover:underline">&larr; Back to Suppliers</Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{supplier.name}</h1>
        </div>
        <div className="flex gap-3">
          <Link href={`/suppliers/${id}/edit`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Edit</Link>
          <button onClick={() => setDeleteOpen(true)} className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Supplier Information</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{supplier.name}</dd></div>
              <div><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900">{supplier.phone || '-'}</dd></div>
              <div><dt className="text-slate-500">Category</dt><dd className="font-medium text-slate-900">{supplier.category || '-'}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{supplier.status}</span></dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Notes</dt><dd className="font-medium text-slate-900">{supplier.notes || '-'}</dd></div>
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Financial Summary</h2>
            {financial ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-medium text-slate-500">Total Commitments</div>
                  <div className="text-xl font-bold text-slate-950">{formatMAD(financial.totalCommitments)}</div>
                </div>
                <div className="rounded-xl bg-green-50 p-4">
                  <div className="text-xs font-medium text-green-600">Total Paid</div>
                  <div className="text-xl font-bold text-green-700">{formatMAD(financial.totalPaid)}</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <div className="text-xs font-medium text-amber-600">Total Remaining</div>
                  <div className="text-xl font-bold text-amber-700">{formatMAD(financial.totalRemaining)}</div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Loading financial data...</p>
            )}
          </div>
        </div>
      </div>

      <DeleteModal
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
        message="Are you sure you want to delete this supplier? This action cannot be undone."
      />
    </div>
  );
}
