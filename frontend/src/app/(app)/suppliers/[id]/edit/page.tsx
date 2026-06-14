'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Supplier } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({ name: '', phone: '', category: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Supplier>(`/suppliers/${id}`).then((s) => {
      setForm({ name: s.name, phone: s.phone || '', category: s.category || '', notes: s.notes || '' });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/suppliers/${id}`, {
        name: form.name,
        phone: form.phone || undefined,
        category: form.category || undefined,
        notes: form.notes || undefined,
      });
      router.push('/suppliers');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) return <LoadingSpinner />;
  if (error && !form.name) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Edit Supplier</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name *</label>
          <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Phone</label>
          <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Category</label>
          <input type="text" value={form.category} onChange={(e) => update('category', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
