'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Project, Commitment, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function NewPaymentPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '', commitmentId: '', amount: '', paymentDate: '',
    paymentMode: 'cash', chequeNumber: '', notes: '',
  });

  useEffect(() => {
    api.get<PaginatedResponse<Project>>('/projects')
      .then((p) => setProjects(p.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.projectId) {
      setCommitments([]);
      return;
    }
    api.get<PaginatedResponse<Commitment>>('/commitments', { projectId: form.projectId })
      .then((c) => setCommitments(c.data))
      .catch(() => {});
  }, [form.projectId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.commitmentId || !form.amount || !form.paymentDate) {
      setError('Please fill all required fields');
      return;
    }
    if (form.paymentMode === 'cheque' && !form.chequeNumber) {
      setError('Please enter a cheque number');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/payments', {
        projectId: form.projectId,
        commitmentId: form.commitmentId,
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        chequeNumber: form.paymentMode === 'cheque' ? form.chequeNumber : null,
        notes: form.notes || undefined,
      });
      router.push('/payments');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950">New Payment</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Project *</label>
          <select value={form.projectId} onChange={(e) => { update('projectId', e.target.value); update('commitmentId', ''); }} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.city}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Commitment *</label>
          <select value={form.commitmentId} onChange={(e) => update('commitmentId', e.target.value)} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="">Select commitment...</option>
            {commitments.map((c) => (
              <option key={c.id} value={c.id}>{c.description.substring(0, 60)} - {c.agreedAmount.toLocaleString('fr-FR')} MAD</option>
            ))}
          </select>
          {!form.projectId && <p className="mt-1 text-xs text-slate-400">Select a project first</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Amount *</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => update('amount', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Date *</label>
            <input type="date" value={form.paymentDate} onChange={(e) => update('paymentDate', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Payment Mode *</label>
          <select value={form.paymentMode} onChange={(e) => update('paymentMode', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        {form.paymentMode === 'cheque' && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Cheque Number *</label>
            <input type="text" value={form.chequeNumber} onChange={(e) => update('chequeNumber', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>

        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Creating...' : 'Create Payment'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
