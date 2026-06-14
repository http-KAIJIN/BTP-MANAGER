'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', cin: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/clients', form);
      router.push('/clients');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const fields = [
    { label: 'Name *', key: 'name', required: true },
    { label: 'Phone', key: 'phone' },
    { label: 'CIN', key: 'cin' },
    { label: 'Address', key: 'address' },
  ];

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950">New Client</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700">{f.label}</label>
            <input type="text" value={(form as Record<string, string>)[f.key]} onChange={(e) => update(f.key, e.target.value)} required={f.required}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Creating...' : 'Create Client'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
