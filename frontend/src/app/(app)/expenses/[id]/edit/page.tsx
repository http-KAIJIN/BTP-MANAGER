'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Expense, Project, ExpenseCategory, Supplier, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '', categoryId: '', supplierId: '', description: '',
    amount: '', expenseDate: '', paymentMode: 'cash', notes: '',
  });

  useEffect(() => {
    Promise.all([
      api.get<Expense>(`/expenses/${params.id}`),
      api.get<PaginatedResponse<Project>>('/projects'),
      api.get<PaginatedResponse<ExpenseCategory>>('/expense-categories'),
      api.get<PaginatedResponse<Supplier>>('/suppliers'),
    ]).then(([expense, p, c, s]) => {
      setProjects(p.data);
      setCategories(c.data);
      setSuppliers(s.data);
      setForm({
        projectId: expense.projectId,
        categoryId: expense.categoryId,
        supplierId: expense.supplierId || '',
        description: expense.description,
        amount: String(expense.amount),
        expenseDate: expense.expenseDate.split('T')[0],
        paymentMode: expense.paymentMode,
        notes: expense.notes || '',
      });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.categoryId || !form.description || !form.amount || !form.expenseDate) {
      setError('Please fill all required fields');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/expenses/${params.id}`, {
        projectId: form.projectId,
        categoryId: form.categoryId,
        supplierId: form.supplierId || null,
        description: form.description,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        paymentMode: form.paymentMode,
        notes: form.notes || undefined,
      });
      router.push('/expenses');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Edit Expense</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Project *</label>
            <select value={form.projectId} onChange={(e) => update('projectId', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
              <option value="">Select project...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category *</label>
            <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
              <option value="">Select category...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Supplier (optional)</label>
          <select value={form.supplierId} onChange={(e) => update('supplierId', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="">No supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Description *</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} required rows={2}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Amount *</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => update('amount', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Date *</label>
            <input type="date" value={form.expenseDate} onChange={(e) => update('expenseDate', e.target.value)} required
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

        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2}
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
