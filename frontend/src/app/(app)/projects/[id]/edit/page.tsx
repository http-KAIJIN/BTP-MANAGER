'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Company, Project } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    startDate: '',
    expectedEndDate: '',
    projectType: '',
    ownershipType: 'internal_company',
    ownerCompanyId: '',
    externalClientName: '',
    externalClientPhone: '',
    externalClientCompany: '',
    executingCompanyId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ data: Company[] }>('/companies'),
      api.get<Project>(`/projects/${id}`),
    ])
      .then(([compRes, project]) => {
        setCompanies(compRes.data || []);
        setForm({
          name: project.name,
          description: project.description || '',
          address: project.address || '',
          city: project.city,
          startDate: project.startDate ? project.startDate.slice(0, 10) : '',
          expectedEndDate: project.expectedEndDate ? project.expectedEndDate.slice(0, 10) : '',
          projectType: project.projectType || '',
          ownershipType: project.ownershipType,
          ownerCompanyId: project.ownerCompanyId || '',
          externalClientName: project.externalClientName || '',
          externalClientPhone: project.externalClientPhone || '',
          externalClientCompany: project.externalClientCompany || '',
          executingCompanyId: project.executingCompanyId,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => { setLoading(false); setLoadingCompanies(false); });
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.city.trim()) { setError('City is required'); return; }
    if (!form.startDate) { setError('Start date is required'); return; }
    if (!form.executingCompanyId) { setError('Executing company is required'); return; }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        city: form.city,
        startDate: form.startDate,
        expectedEndDate: form.expectedEndDate || undefined,
        projectType: form.projectType || undefined,
        ownershipType: form.ownershipType,
        executingCompanyId: form.executingCompanyId,
      };
      if (form.ownershipType === 'internal_company') {
        body.ownerCompanyId = form.ownerCompanyId || undefined;
      } else {
        body.externalClientName = form.externalClientName || undefined;
        body.externalClientPhone = form.externalClientPhone || undefined;
        body.externalClientCompany = form.externalClientCompany || undefined;
      }
      await api.patch(`/projects/${id}`, body);
      router.push('/projects');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  if (loading || loadingCompanies) return <LoadingSpinner />;
  if (error && !form.name) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Edit Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name *</label>
          <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Address</label>
          <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">City *</label>
          <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Start Date *</label>
            <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Expected End Date</label>
            <input type="date" value={form.expectedEndDate} onChange={(e) => update('expectedEndDate', e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Project Type</label>
          <input type="text" value={form.projectType} onChange={(e) => update('projectType', e.target.value)} placeholder="e.g. residential, commercial"
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Ownership Type</label>
          <select value={form.ownershipType} onChange={(e) => update('ownershipType', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="internal_company">Internal Company</option>
            <option value="external_client">External Client</option>
          </select>
        </div>
        {form.ownershipType === 'internal_company' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700">Owner Company</label>
            <select value={form.ownerCompanyId} onChange={(e) => update('ownerCompanyId', e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
              <option value="">Select a company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">External Client Name</label>
              <input type="text" value={form.externalClientName} onChange={(e) => update('externalClientName', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">External Client Phone</label>
              <input type="text" value={form.externalClientPhone} onChange={(e) => update('externalClientPhone', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">External Client Company</label>
              <input type="text" value={form.externalClientCompany} onChange={(e) => update('externalClientCompany', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">Executing Company *</label>
          <select value={form.executingCompanyId} onChange={(e) => update('executingCompanyId', e.target.value)} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="">Select a company</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
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
