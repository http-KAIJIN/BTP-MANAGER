'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import LoadingSpinner from '@/components/loading-spinner';

interface Phase {
  id: string | null;
  projectId: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  notes: string | null;
}

interface PhasesResponse {
  phases: Phase[];
  globalProgress: number;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function ProjectConstructionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<PhasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Phase>>({});
  const [saving, setSaving] = useState(false);

  const fetchPhases = () => {
    setLoading(true);
    api.get<PhasesResponse>(`/construction/projects/${id}/phases`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPhases(); }, [id]);

  const startEdit = (phase: Phase) => {
    setEditing(phase.name);
    setEditForm({
      status: phase.status,
      progress: phase.progress,
      startDate: phase.startDate?.split('T')[0] ?? '',
      endDate: phase.endDate?.split('T')[0] ?? '',
      notes: phase.notes ?? '',
    });
  };

  const saveEdit = async (phaseName: string) => {
    setSaving(true);
    try {
      await api.patch(`/construction/projects/${id}/phases/${encodeURIComponent(phaseName)}`, {
        status: editForm.status,
        progress: Number(editForm.progress),
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        notes: editForm.notes || null,
      });
      setEditing(null);
      fetchPhases();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner text="Loading construction phases..." />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/construction" className="text-sm text-orange-600 hover:underline">&larr; Construction Tracking</Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 mt-1">Project Construction</h1>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Global Progress</div>
            <div className="text-3xl font-bold text-slate-950">{data.globalProgress}%</div>
          </div>
          <div className="w-2/3">
            <div className="h-4 rounded-full bg-slate-100">
              <div className="h-4 rounded-full bg-orange-500 transition-all" style={{ width: `${data.globalProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.phases.map((phase) => (
          <div key={phase.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {editing === phase.name ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{phase.name}</h3>
                  <button onClick={() => setEditing(null)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500">Status</label>
                    <select value={editForm.status || ''} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500">Progress %</label>
                    <input type="number" min={0} max={100} value={editForm.progress ?? 0} onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500">Start Date</label>
                    <input type="date" value={editForm.startDate || ''} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500">End Date</label>
                    <input type="date" value={editForm.endDate || ''} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Notes</label>
                  <textarea value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <button onClick={() => saveEdit(phase.name)} disabled={saving}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900">{phase.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[phase.status] || 'bg-slate-100 text-slate-600'}`}>
                      {phase.status.replace('_', ' ')}
                    </span>
                  </div>
                  <button onClick={() => startEdit(phase)} className="text-sm text-orange-600 hover:text-orange-700 font-medium">Edit</button>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-orange-500" style={{ width: `${phase.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{phase.progress}%</span>
                </div>
                {(phase.startDate || phase.endDate) && (
                  <div className="mt-2 text-xs text-slate-500">
                    {phase.startDate && <span>Start: {new Date(phase.startDate).toLocaleDateString('fr-FR')} </span>}
                    {phase.endDate && <span>End: {new Date(phase.endDate).toLocaleDateString('fr-FR')}</span>}
                  </div>
                )}
                {phase.notes && <div className="mt-1 text-sm text-slate-600">{phase.notes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
