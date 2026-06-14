'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Project, Supplier, Intervenant, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function NewCommitmentPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '', beneficiaryType: 'supplier', supplierId: '', intervenantId: '',
    description: '', agreedAmount: '', commitmentDate: '', notes: '',
  });

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Project>>('/projects'),
      api.get<PaginatedResponse<Supplier>>('/suppliers'),
      api.get<PaginatedResponse<Intervenant>>('/intervenants'),
    ]).then(([p, s, i]) => {
      setProjects(p.data);
      setSuppliers(s.data);
      setIntervenants(i.data);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.description || !form.agreedAmount || !form.commitmentDate) {
      setError('Please fill all required fields');
      return;
    }
    if (form.beneficiaryType === 'supplier' && !form.supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (form.beneficiaryType === 'intervenant' && !form.intervenantId) {
      setError('Please select an intervenant');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/commitments', {
        projectId: form.projectId,
        beneficiaryType: form.beneficiaryType,
        supplierId: form.beneficiaryType === 'supplier' ? form.supplierId : null,
        intervenantId: form.beneficiaryType === 'intervenant' ? form.intervenantId : null,
        description: form.description,
        agreedAmount: Number(form.agreedAmount),
        commitmentDate: form.commitmentDate,
        notes: form.notes || undefined,
      });
      router.push('/commitments');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950">New Commitment</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Project *</label>
          <select value={form.projectId} onChange={(e) => update('projectId', e.target.value)} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.city}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Beneficiary Type *</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="beneficiaryType" value="supplier" checked={form.beneficiaryType === 'supplier'}
                onChange={(e) => update('beneficiaryType', e.target.value)} className="text-orange-500" /> Supplier
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="beneficiaryType" value="intervenant" checked={form.beneficiaryType === 'intervenant'}
                onChange={(e) => update('beneficiaryType', e.target.value)} className="text-orange-500" /> Intervenant
            </label>
          </div>
        </div>

        {form.beneficiaryType === 'supplier' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700">Supplier *</label>
            <select value={form.supplierId} onChange={(e) => update('supplierId', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
              <option value="">Select supplier...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700">Intervenant *</label>
            <select value={form.intervenantId} onChange={(e) => update('intervenantId', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
              <option value="">Select intervenant...</option>
              {intervenants.map((i) => <option key={i.id} value={i.id}>{i.name} - {i.trade}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">Description *</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} required rows={2}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Agreed Amount *</label>
            <input type="number" step="0.01" value={form.agreedAmount} onChange={(e) => update('agreedAmount', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Date *</label>
            <input type="date" value={form.commitmentDate} onChange={(e) => update('commitmentDate', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>

        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Creating...' : 'Create Commitment'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
