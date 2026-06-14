'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function NewSale() {
  const router = useRouter();
  const [form, setForm] = useState({ clientId: '', propertyId: '', salePrice: '', downPayment: '', saleDate: new Date().toISOString().split('T')[0], notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/real-estate/sales', {
        ...form,
        salePrice: Number(form.salePrice),
        downPayment: form.downPayment ? Number(form.downPayment) : undefined,
      });
      router.push('/sales');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">New Sale</h1>
      {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Client ID *</label><input required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Property ID *</label><input required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Sale Price (MAD) *</label><input required type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Down Payment (MAD)</label><input type="number" step="0.01" min="0" value={form.downPayment} onChange={(e) => setForm({ ...form, downPayment: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Sale Date</label><input type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
