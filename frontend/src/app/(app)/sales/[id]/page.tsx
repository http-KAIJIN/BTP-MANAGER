'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Sale, SalePayment } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<(Sale & { totalPaid?: number; remainingBalance?: number }) | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
  const [paySaving, setPaySaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Sale>(`/real-estate/sales/${id}`).then(setSale),
      api.get<SalePayment[]>(`/real-estate/sales/${id}/payments`).then(setPayments),
    ]).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaySaving(true);
    try {
      await api.post(`/real-estate/sales/${id}/payments`, { ...payForm, amount: Number(payForm.amount) });
      setPayForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
    setPaySaving(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Delete this payment?')) return;
    try {
      await api.delete(`/real-estate/sales/${id}/payments/${paymentId}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!sale) return null;

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { EN_COURS: 'bg-yellow-100 text-yellow-700', TERMINE: 'bg-green-100 text-green-700', ANNULE: 'bg-red-100 text-red-700' };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m[s] || 'bg-slate-100 text-slate-700'}`}>{s === 'EN_COURS' ? 'In Progress' : s === 'TERMINE' ? 'Completed' : s === 'ANNULE' ? 'Cancelled' : s}</span>;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Sale #{sale.id.slice(0, 8)}</h1>
          <p className="mt-1 text-sm text-slate-500">{statusBadge(sale.status)}</p>
        </div>
        <Link href={`/sales/${id}/edit`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Edit</Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Sale Info</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Client</dt><dd className="font-medium">{sale.client?.name || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Property</dt><dd className="font-medium">{sale.property?.reference || '-'} ({sale.property?.type || '-'})</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Sale Price</dt><dd className="font-medium">{Number(sale.salePrice).toLocaleString()} MAD</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Down Payment</dt><dd className="font-medium">{Number(sale.downPayment).toLocaleString()} MAD</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd className="font-medium">{new Date(sale.saleDate).toLocaleDateString()}</dd></div>
            {sale.notes && <div className="flex justify-between"><dt className="text-slate-500">Notes</dt><dd className="font-medium">{sale.notes}</dd></div>}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Financial Summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Total Paid</dt><dd className="font-medium text-green-600">{Number(sale.totalPaid ?? 0).toLocaleString()} MAD</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Remaining</dt><dd className="font-medium text-orange-600">{Number(sale.remainingBalance ?? Number(sale.salePrice)).toLocaleString()} MAD</dd></div>
          </dl>
        </div>
      </div>

      {/* Payments */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Payments</h2>

        <form onSubmit={handleAddPayment} className="mb-6 flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-xs font-medium text-slate-500">Amount *</label><input required type="number" step="0.01" min="0" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">Date</label><input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">Notes</label><input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none" /></div>
          <button type="submit" disabled={paySaving} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">{paySaving ? 'Adding...' : 'Add Payment'}</button>
        </form>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount (MAD)</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{Number(p.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-500">{p.notes || '-'}</td>
                <td className="px-4 py-3"><button onClick={() => handleDeletePayment(p.id)} className="text-xs text-red-600 hover:underline">Delete</button></td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No payments recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
