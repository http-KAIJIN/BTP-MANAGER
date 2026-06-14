'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Sale } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function EditSale() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ salePrice: '', downPayment: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Sale>(`/real-estate/sales/${id}`)
      .then((s) => setForm({ salePrice: String(s.salePrice), downPayment: String(s.downPayment), notes: s.notes || '' }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/real-estate/sales/${id}`, {
        salePrice: Number(form.salePrice),
        downPayment: Number(form.downPayment),
        notes: form.notes,
      });
      router.push(`/sales/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">Edit Sale</h1>
      {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Sale Price (MAD) *</label><input required type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Down Payment (MAD)</label><input type="number" step="0.01" min="0" value={form.downPayment} onChange={(e) => setForm({ ...form, downPayment: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving...' : 'Update'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
