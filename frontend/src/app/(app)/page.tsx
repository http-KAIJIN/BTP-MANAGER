'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { DashboardSummary, RecentPayment, OutstandingCommitment } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

function formatMAD(amount: number) {
  return amount.toLocaleString('fr-FR') + ' MAD';
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [outstanding, setOutstanding] = useState<OutstandingCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<DashboardSummary>('/dashboard/summary'),
      api.get<RecentPayment[]>('/dashboard/recent-payments?limit=5'),
      api.get<OutstandingCommitment[]>('/dashboard/outstanding-commitments?limit=10'),
    ])
      .then(([s, p, o]) => {
        setSummary(s);
        setRecentPayments(p);
        setOutstanding(o);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  const kpiCards = summary ? [
    { label: 'Active Projects', value: summary.totalProjects.toString(), detail: `${summary.totalSuppliers} suppliers` },
    { label: 'Total Commitments', value: formatMAD(summary.totalCommitments), detail: 'Across all projects' },
    { label: 'Total Paid', value: formatMAD(summary.totalPaid), detail: summary.totalCommitments > 0 ? `${Math.round((summary.totalPaid / summary.totalCommitments) * 100)}% paid` : 'No commitments' },
    { label: 'Total Remaining', value: formatMAD(summary.totalRemaining), detail: `${formatMAD(summary.totalExpenses)} expenses`, warning: summary.totalRemaining > 0 },
  ] : [];

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {summary?.totalIntervenants} intervenants &middot; {summary?.totalProjects} projects
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">{kpi.label}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{kpi.value}</div>
            <div className={kpi.warning ? 'mt-1 text-sm font-medium text-amber-600' : 'mt-1 text-sm text-slate-500'}>{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Recent Payments</h2>
          {recentPayments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.project.name}</div>
                    <div className="text-xs text-slate-500">{p.commitment.description.slice(0, 50)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{formatMAD(p.amount)}</div>
                    <div className="text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/payments" className="mt-4 inline-block text-sm font-semibold text-orange-600">View all payments &rarr;</Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Outstanding Commitments</h2>
          {outstanding.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">All commitments are paid.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {outstanding.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{c.projectName}</div>
                    <div className="text-xs text-slate-500">{c.beneficiaryName || c.description.slice(0, 40)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{formatMAD(c.agreedAmount)}</div>
                    <div className={`text-xs ${c.status === 'open' ? 'text-amber-600' : 'text-slate-500'}`}>{c.status.replace('_', ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/commitments" className="mt-4 inline-block text-sm font-semibold text-orange-600">View all commitments &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
