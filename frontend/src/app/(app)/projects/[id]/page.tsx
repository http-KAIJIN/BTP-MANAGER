'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Project, FinancialSummary } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

function formatMAD(amount: number) {
  return amount.toLocaleString('fr-FR') + ' MAD';
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Project>(`/projects/${id}`),
      api.get<FinancialSummary>(`/projects/${id}/financial-summary`),
    ])
      .then(([p, f]) => { setProject(p); setFinancial(f); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      router.push('/projects');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!project) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/projects" className="text-sm text-orange-600 hover:underline">&larr; Back to Projects</Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{project.city}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/projects/${id}/edit`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Edit</Link>
          <button onClick={() => setDeleteOpen(true)} className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Project Information</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{project.name}</dd></div>
              <div><dt className="text-slate-500">City</dt><dd className="font-medium text-slate-900">{project.city}</dd></div>
              <div><dt className="text-slate-500">Address</dt><dd className="font-medium text-slate-900">{project.address || '-'}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                project.status === 'PLANNED' ? 'bg-purple-100 text-purple-700' :
                project.status === 'ON_HOLD' ? 'bg-amber-100 text-amber-700' :
                project.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>{project.status.replace(/_/g, ' ')}</span></dd></div>
              <div><dt className="text-slate-500">Project Type</dt><dd className="font-medium text-slate-900">{project.projectType || '-'}</dd></div>
              <div><dt className="text-slate-500">Ownership</dt><dd className="font-medium text-slate-900">{project.ownershipType === 'internal_company' ? 'Internal Company' : 'External Client'}</dd></div>
              <div><dt className="text-slate-500">Start Date</dt><dd className="font-medium text-slate-900">{new Date(project.startDate).toLocaleDateString('fr-FR')}</dd></div>
              <div><dt className="text-slate-500">Expected End Date</dt><dd className="font-medium text-slate-900">{project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString('fr-FR') : '-'}</dd></div>
              <div><dt className="text-slate-500">Actual End Date</dt><dd className="font-medium text-slate-900">{project.actualEndDate ? new Date(project.actualEndDate).toLocaleDateString('fr-FR') : '-'}</dd></div>
              <div><dt className="text-slate-500">Description</dt><dd className="font-medium text-slate-900">{project.description || '-'}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Owner & Executing Company</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Owner</dt><dd className="font-medium text-slate-900">
                {project.ownershipType === 'internal_company'
                  ? project.ownerCompany?.name || '-'
                  : project.externalClientName || 'External'
                }
              </dd></div>
              {project.ownershipType === 'external_client' && (
                <>
                  <div><dt className="text-slate-500">Client Phone</dt><dd className="font-medium text-slate-900">{project.externalClientPhone || '-'}</dd></div>
                  <div><dt className="text-slate-500">Client Company</dt><dd className="font-medium text-slate-900">{project.externalClientCompany || '-'}</dd></div>
                </>
              )}
              <div><dt className="text-slate-500">Executing Company</dt><dd className="font-medium text-slate-900">{project.executingCompany?.name || '-'}</dd></div>
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Financial Summary</h2>
            {financial ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-medium text-slate-500">Total Commitments</div>
                  <div className="text-xl font-bold text-slate-950">{formatMAD(financial.totalCommitments)}</div>
                </div>
                <div className="rounded-xl bg-green-50 p-4">
                  <div className="text-xs font-medium text-green-600">Total Paid</div>
                  <div className="text-xl font-bold text-green-700">{formatMAD(financial.totalPaid)}</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <div className="text-xs font-medium text-amber-600">Total Remaining</div>
                  <div className="text-xl font-bold text-amber-700">{formatMAD(financial.totalRemaining)}</div>
                </div>
                <div className="rounded-xl bg-red-50 p-4">
                  <div className="text-xs font-medium text-red-600">Total Expenses</div>
                  <div className="text-xl font-bold text-red-700">{formatMAD(financial.totalExpenses ?? 0)}</div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Loading financial data...</p>
            )}
          </div>
        </div>
      </div>

      <DeleteModal
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
        message="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  );
}
