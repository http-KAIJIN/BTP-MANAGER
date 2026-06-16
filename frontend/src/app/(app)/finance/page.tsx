"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock, Wallet, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { FinanceDashboard, BudgetVsActual } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { ErrorState } from "@/components/ui-kit/error-state";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { ChartCard } from "@/components/ui-kit/chart-card";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancePage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetVsActual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<FinanceDashboard>("/finance/dashboard"),
      api.get<BudgetVsActual[]>("/finance/budget-vs-actual"),
    ])
      .then(([d, b]) => { setDashboard(d); setBudgetData(b); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!dashboard) return null;

  const budgetColumns: Column<BudgetVsActual>[] = [
    { key: "project", header: dict.nav.projects, cell: (b) => <span className="font-medium text-foreground cursor-pointer hover:text-primary" onClick={() => router.push(`/projects/${b.projectId}`)}>{b.projectName}</span> },
    { key: "budget", header: dict.finance.budget, className: "text-end", cell: (b) => formatMAD(b.budget) },
    { key: "paid", header: dict.finance.paid, className: "text-end", cell: (b) => formatMAD(b.paid) },
    { key: "remaining", header: dict.finance.remaining, className: "text-end", cell: (b) => <span className={b.remaining < 0 ? "text-destructive" : ""}>{formatMAD(b.remaining)}</span> },
    { key: "margin", header: dict.finance.marginPct, className: "text-end", cell: (b) => {
      const color = b.budgetStatus === "healthy" ? "text-emerald-600 dark:text-emerald-400" : b.budgetStatus === "warning" ? "text-amber-600 dark:text-amber-400" : "text-destructive";
      return <span className={`font-medium ${color}`}>{b.marginPct}%</span>;
    }},
    { key: "status", header: dict.labels.status, className: "text-end", cell: (b) => {
      const color = b.budgetStatus === "healthy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : b.budgetStatus === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
      const label = b.budgetStatus === "healthy" ? dict.finance.healthy : b.budgetStatus === "warning" ? dict.finance.warning : dict.finance.exceeded;
      return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
    }},
  ];

  const profitColor = dashboard.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
  const monthProfitColor = dashboard.profitThisMonth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.finance.title} />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label={dict.finance.totalRevenue}
          value={formatMAD(dashboard.totalRevenue)}
          icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          label={dict.finance.totalExpenses}
          value={formatMAD(dashboard.totalExpenses)}
          icon={TrendingDown}
          accent="red"
        />
        <KpiCard
          label={dict.finance.netProfit}
          value={formatMAD(dashboard.netProfit)}
          icon={DollarSign}
          accent={dashboard.netProfit >= 0 ? "green" : "red"}
          detail={dashboard.netProfit >= 0 ? dict.finance.healthy : dict.finance.warning}
          detailTone={dashboard.netProfit >= 0 ? "positive" : "warning"}
        />
        <KpiCard
          label={dict.finance.outstandingInvoices}
          value={`${dashboard.outstandingInvoices.count}`}
          icon={FileText}
          accent="amber"
          detail={formatMAD(dashboard.outstandingInvoices.amount)}
        />
        <KpiCard
          label={dict.finance.cashPosition}
          value={formatMAD(dashboard.cashPosition)}
          icon={Wallet}
          accent={dashboard.cashPosition >= 0 ? "blue" : "red"}
        />
      </div>

      {/* Monthly KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard
          label={dict.finance.revenueThisMonth}
          value={formatMAD(dashboard.revenueThisMonth)}
          icon={ArrowUpRight}
          accent="green"
        />
        <KpiCard
          label={dict.finance.expensesThisMonth}
          value={formatMAD(dashboard.expensesThisMonth)}
          icon={ArrowDownRight}
          accent="red"
        />
        <KpiCard
          label={dict.finance.profitThisMonth}
          value={formatMAD(dashboard.profitThisMonth)}
          icon={Calendar}
          accent={dashboard.profitThisMonth >= 0 ? "green" : "red"}
        />
      </div>

      {/* Budget vs Actual */}
      <div className="space-y-3">
        <h2 className="text-base font-bold">{dict.finance.budgetVsActual}</h2>
        <DataTable
          columns={budgetColumns}
          data={budgetData}
          loading={loading}
          rowKey={(b) => b.projectId}
          onRowClick={(b) => router.push(`/projects/${b.projectId}`)}
          emptyText={dict.labels.noData}
        />
      </div>
    </div>
  );
}
