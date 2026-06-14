'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Project, Supplier, Intervenant, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function formatMAD(amount: number) {
  return amount.toLocaleString('fr-FR') + ' MAD';
}

interface ProjectReport {
  project: { id: string; name: string; city: string; status: string; startDate: string; expectedEndDate: string | null; executingCompany: string | null; ownerCompany: string | null };
  financial: { totalCommitments: number; totalPaid: number; totalRemaining: number; totalExpenses: number };
  constructionProgress: number;
  commitments: { id: string; description: string; beneficiaryName: string | null; agreedAmount: number; status: string }[];
  payments: { id: string; amount: number; paymentDate: string; paymentMode: string }[];
  expensesByCategory: { category: string; total: number }[];
}

interface SupplierReport {
  supplier: { id: string; name: string };
  financial: { totalCommitments: number; totalPaid: number; totalRemaining: number };
  commitments: { projectName: string; description: string; agreedAmount: number; status: string }[];
}

interface IntervenantReport {
  intervenant: { id: string; name: string; trade: string };
  financial: { totalCommitments: number; totalPaid: number; totalRemaining: number };
  commitments: { projectName: string; description: string; agreedAmount: number; status: string }[];
}

type ReportType = 'project' | 'supplier' | 'intervenant';

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState<ProjectReport | SupplierReport | IntervenantReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Project>>('/projects?limit=100'),
      api.get<PaginatedResponse<Supplier>>('/suppliers?limit=100'),
      api.get<PaginatedResponse<Intervenant>>('/intervenants?limit=100'),
    ]).then(([p, s, i]) => {
      setProjects(p.data);
      setSuppliers(s.data);
      setIntervenants(i.data);
    }).catch(() => {}).finally(() => setLoadingEntities(false));
  }, []);

  const generateReport = () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    setReport(null);

    const endpoint = type === 'project'
      ? `/reports/projects/${selectedId}`
      : type === 'supplier'
        ? `/reports/suppliers/${selectedId}`
        : `/reports/intervenants/${selectedId}`;

    api.get<ProjectReport | SupplierReport | IntervenantReport>(endpoint)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const getCsvUrl = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return `${API_BASE}/reports/projects/csv?token=${token}`;
  };

  const label = type === 'project' ? 'Project' : type === 'supplier' ? 'Supplier' : 'Intervenant';
  const entities = type === 'project' ? projects : type === 'supplier' ? suppliers : intervenants;
  const entityLabel = (e: { id: string; name: string; city?: string; trade?: string }) =>
    type === 'project' ? `${e.name} - ${(e as Project).city}` :
    type === 'supplier' ? (e as Supplier).name :
    `${(e as Intervenant).name} (${(e as Intervenant).trade})`;

  const renderProjectReport = (r: ProjectReport) => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{r.project.name}</h2>
        <p className="text-sm text-slate-500">{r.project.city} &middot; {r.project.status} &middot; {r.project.executingCompany}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Total Commitments', r.financial.totalCommitments],
          ['Total Paid', r.financial.totalPaid],
          ['Total Remaining', r.financial.totalRemaining],
          ['Total Expenses', r.financial.totalExpenses],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">{label as string}</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">{formatMAD(value as number)}</div>
          </div>
        ))}
      </div>

      {r.constructionProgress > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Construction Progress</span>
            <span className="font-bold text-slate-900">{r.constructionProgress}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-orange-500" style={{ width: `${r.constructionProgress}%` }} />
          </div>
        </div>
      )}

      {r.expensesByCategory.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Expenses by Category</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-4 py-2">Category</th><th className="px-4 py-2">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {r.expensesByCategory.map((e) => (
                <tr key={e.category} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700">{e.category}</td>
                  <td className="px-4 py-2 font-medium">{formatMAD(e.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSupplierReport = (r: SupplierReport) => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{r.supplier.name}</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Commitments</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{formatMAD(r.financial.totalCommitments)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Paid</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{formatMAD(r.financial.totalPaid)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Remaining</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{formatMAD(r.financial.totalRemaining)}</div>
        </div>
      </div>
    </div>
  );

  const renderIntervenantReport = (r: IntervenantReport) => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{r.intervenant.name}</h2>
        <p className="text-sm text-slate-500">{r.intervenant.trade}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Commitments</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{formatMAD(r.financial.totalCommitments)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Paid</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{formatMAD(r.financial.totalPaid)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Remaining</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{formatMAD(r.financial.totalRemaining)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Reports</h1>
          <p className="text-sm text-slate-500">Generate financial and progress reports</p>
        </div>
        <a href={getCsvUrl()} download
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Export CSV
        </a>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
          <select value={type} onChange={(e) => { setType(e.target.value as ReportType); setSelectedId(''); setReport(null); }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="project">Project Report</option>
            <option value="supplier">Supplier Report</option>
            <option value="intervenant">Intervenant Report</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
            <option value="">Select {label.toLowerCase()}...</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{entityLabel(e)}</option>
            ))}
          </select>
        </div>
        <button onClick={generateReport} disabled={!selectedId || loadingEntities}
          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Generating report..." />}
      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {report && !loading && (
        type === 'project' ? renderProjectReport(report as ProjectReport) :
        type === 'supplier' ? renderSupplierReport(report as SupplierReport) :
        renderIntervenantReport(report as IntervenantReport)
      )}
    </div>
  );
}
