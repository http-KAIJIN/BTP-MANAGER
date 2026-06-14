'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Payment } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

function formatMAD(amount: number) {
  return amount.toLocaleString('fr-FR') + ' MAD';
}

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Payment>(`/payments/${params.id}`)
      .then(setPayment)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/payments/${params.id}`);
      router.push('/payments');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!payment) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Payment Detail</h1>
          <p className="mt-1 text-sm text-slate-500">Created on {new Date(payment.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/payments/${params.id}/edit`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">Edit</Link>
          <button onClick={() => setDeleteOpen(true)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
          <Link href="/payments" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Back</Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-500">Project</dt><dd className="font-medium text-slate-900">{payment.project?.name || 'N/A'}</dd></div>
          <div><dt className="text-slate-500">Commitment</dt><dd className="font-medium text-slate-900">{payment.commitment?.description || '-'}</dd></div>
          <div><dt className="text-slate-500">Amount</dt><dd className="font-medium text-slate-900">{formatMAD(payment.amount)}</dd></div>
          <div><dt className="text-slate-500">Payment Date</dt><dd className="font-medium text-slate-900">{new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</dd></div>
          <div><dt className="text-slate-500">Payment Mode</dt><dd className="font-medium capitalize text-slate-900">{payment.paymentMode.replace('_', ' ')}</dd></div>
          <div><dt className="text-slate-500">Beneficiary</dt><dd className="font-medium text-slate-900">{payment.supplier?.name || payment.intervenant?.name || '-'}</dd></div>
          {payment.chequeNumber && <div><dt className="text-slate-500">Cheque Number</dt><dd className="font-medium text-slate-900">{payment.chequeNumber}</dd></div>}
          {payment.notes && <div className="col-span-2"><dt className="text-slate-500">Notes</dt><dd className="font-medium text-slate-900">{payment.notes}</dd></div>}
        </dl>
      </div>

      <DeleteModal open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleting} />
    </div>
  );
}
