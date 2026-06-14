'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Commitment } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

function formatMAD(amount: number) {
  return amount.toLocaleString('fr-FR') + ' MAD';
}

interface CommitmentBalance {
  agreedAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
  beneficiaryName: string;
}

export default function CommitmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [balance, setBalance] = useState<CommitmentBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Commitment>(`/commitments/${params.id}`),
      api.get<CommitmentBalance>(`/commitments/${params.id}/balance`).catch(() => null),
    ]).then(([c, b]) => {
      setCommitment(c);
      setBalance(b);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/commitments/${params.id}`);
      router.push('/commitments');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!commitment) return null;

  const statusColor: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Commitment Detail</h1>
          <p className="mt-1 text-sm text-slate-500">Created on {new Date(commitment.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/commitments/${params.id}/edit`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">Edit</Link>
          <button onClick={() => setDeleteOpen(true)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
          <Link href="/commitments" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Back</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">General Information</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Project</dt><dd className="font-medium text-slate-900">{commitment.project?.name || 'N/A'}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[commitment.status] || 'bg-amber-100 text-amber-700'}`}>{commitment.status.replace('_', ' ')}</span></dd></div>
              <div><dt className="text-slate-500">Beneficiary Type</dt><dd className="font-medium text-slate-900 capitalize">{commitment.beneficiaryType}</dd></div>
              <div><dt className="text-slate-500">Beneficiary</dt><dd className="font-medium text-slate-900">{commitment.supplier?.name || commitment.intervenant?.name || '-'}</dd></div>
              <div><dt className="text-slate-500">Description</dt><dd className="font-medium text-slate-900 col-span-2">{commitment.description}</dd></div>
              <div><dt className="text-slate-500">Commitment Date</dt><dd className="font-medium text-slate-900">{new Date(commitment.commitmentDate).toLocaleDateString('fr-FR')}</dd></div>
              <div><dt className="text-slate-500">Agreed Amount</dt><dd className="font-medium text-slate-900">{formatMAD(commitment.agreedAmount)}</dd></div>
              {commitment.notes && <div className="col-span-2"><dt className="text-slate-500">Notes</dt><dd className="font-medium text-slate-900">{commitment.notes}</dd></div>}
            </dl>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Balance</h2>
            {balance ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Agreed</span><span className="font-medium">{formatMAD(balance.agreedAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Paid</span><span className="font-medium text-green-600">{formatMAD(balance.totalPaid)}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-500">Remaining</span><span className={`font-semibold ${balance.remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>{formatMAD(balance.remainingAmount)}</span></div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">Balance unavailable</p>
            )}
          </div>
        </div>
      </div>

      <DeleteModal open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleting} />
    </div>
  );
}
