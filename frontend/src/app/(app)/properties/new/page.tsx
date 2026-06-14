'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function NewProperty() {
  const router = useRouter();
  const [form, setForm] = useState({ reference: '', type: 'APPARTEMENT', surface: '', projectId: '', price: '', status: 'DISPONIBLE', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/real-estate/properties', {
        ...form,
        surface: Number(form.surface),
        price: Number(form.price),
      });
      router.push('/properties');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">New Property</h1>
      {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Reference *</label><input required value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"><option value="APPARTEMENT">Apartment</option><option value="LOCAL_COMMERCIAL">Local Commercial</option><option value="BUREAU">Office</option><option value="ENTREPOT">Warehouse</option></select></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"><option value="DISPONIBLE">Available</option><option value="RESERVE">Reserved</option><option value="VENDU">Sold</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Surface (m²) *</label><input required type="number" step="0.01" min="0" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Price (MAD) *</label><input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Project ID *</label><input required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
