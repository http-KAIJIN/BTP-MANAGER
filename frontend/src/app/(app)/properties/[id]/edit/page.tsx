'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Property } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ reference: '', type: 'APPARTEMENT', surface: '', price: '', status: 'DISPONIBLE', notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Property>(`/real-estate/properties/${id}`)
      .then((p) => setForm({ reference: p.reference, type: p.type, surface: String(p.surface), price: String(p.price), status: p.status, notes: p.notes || '' }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/real-estate/properties/${id}`, {
        ...form,
        surface: Number(form.surface),
        price: Number(form.price),
      });
      router.push(`/properties/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">Edit Property</h1>
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
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving...' : 'Update'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
