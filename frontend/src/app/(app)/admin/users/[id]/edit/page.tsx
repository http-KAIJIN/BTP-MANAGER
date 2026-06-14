'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { User, Role } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', status: 'ACTIVE' });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<User>(`/users/${id}`),
      api.get<Role[]>('/roles'),
    ]).then(([user, allRoles]) => {
      setForm({ fullName: user.fullName, email: user.email, phone: user.phone || '', password: '', status: user.status });
      setSelectedRoles(user.roles.map((r) => r.code));
      setRoles(allRoles);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = { fullName: form.fullName, email: form.email, status: form.status, roleCodes: selectedRoles };
      if (form.phone) body.phone = form.phone;
      if (form.password) body.password = form.password;
      await api.patch(`/users/${id}`, body);
      router.push('/admin/users');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
    setSaving(false);
  };

  const toggleRole = (code: string) => {
    setSelectedRoles((prev) => prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !form.fullName) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Edit User</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Full Name *</label>
          <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email *</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Phone</label>
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password (leave blank to keep current)</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Roles</label>
          <div className="space-y-2">
            {roles.map((role) => (
              <label key={role.code} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={() => toggleRole(role.code)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                <div>
                  <div className="text-sm font-medium text-slate-900">{role.name}</div>
                  {role.description && <div className="text-xs text-slate-500">{role.description}</div>}
                </div>
              </label>
            ))}
          </div>
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
