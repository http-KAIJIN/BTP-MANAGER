"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileSignature,
  BanknoteArrowUp,
  Wallet,
  ReceiptText,
  UserCog,
  UsersRound,
  ArrowLeft,
  TriangleAlert,
  CircleDollarSign,
  Activity,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import { buildMonthlySeries } from "@/lib/dashboard-charts";
import type {
  DashboardSummary,
  RecentPayment,
  OutstandingCommitment,
  Project,
  Payment,
  Expense,
  Commitment,
  PaginatedResponse,
} from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { ChartCard } from "@/components/ui-kit/chart-card";
import { TrendChart } from "@/components/ui-kit/trend-chart";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BIG_PAGE = { limit: "100" };

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [outstanding, setOutstanding] = useState<OutstandingCommitment[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // The summary is the only critical call; the rest are resilient so a single
    // endpoint failure can't blank the whole dashboard.
    const empty = <T,>(): PaginatedResponse<T> => ({ data: [], meta: { page: 1, limit: 0, total: 0, totalPages: 0 } });
    Promise.all([
      api.get<DashboardSummary>("/dashboard/summary"),
      api.get<RecentPayment[]>("/dashboard/recent-payments?limit=6").catch(() => [] as RecentPayment[]),
      api.get<OutstandingCommitment[]>("/dashboard/outstanding-commitments?limit=10").catch(() => [] as OutstandingCommitment[]),
      api.get<PaginatedResponse<Project>>("/projects", { status: "ACTIVE", limit: "6" }).catch(empty<Project>),
      api.get<PaginatedResponse<Payment>>("/payments", BIG_PAGE).catch(empty<Payment>),
      api.get<PaginatedResponse<Expense>>("/expenses", BIG_PAGE).catch(empty<Expense>),
      api.get<PaginatedResponse<Commitment>>("/commitments", BIG_PAGE).catch(empty<Commitment>),
    ])
      .then(([s, rp, oc, ap, pay, exp, com]) => {
        setSummary(s);
        setRecentPayments(rp);
        setOutstanding(oc);
        setActiveProjects(ap.data ?? []);
        setPayments(pay.data ?? []);
        setExpenses(exp.data ?? []);
        setCommitments(com.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error)
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      </div>
    );

  const paymentsSeries = buildMonthlySeries(payments, "paymentDate", "amount");
  const expensesSeries = buildMonthlySeries(expenses, "expenseDate", "amount");
  const commitmentsSeries = buildMonthlySeries(commitments, "commitmentDate", "agreedAmount");

  const kpis = [
    { label: dict.dashboard.totalProjects, value: summary?.totalProjects ?? 0, icon: Building2, accent: "blue" as const },
    { label: dict.dashboard.totalCommitments, value: formatMAD(summary?.totalCommitments), icon: FileSignature, accent: "orange" as const },
    { label: dict.dashboard.totalPaid, value: formatMAD(summary?.totalPaid), icon: BanknoteArrowUp, accent: "green" as const },
    { label: dict.dashboard.totalRemaining, value: formatMAD(summary?.totalRemaining), icon: Wallet, accent: "amber" as const, detailTone: "warning" as const },
    { label: dict.dashboard.totalExpenses, value: formatMAD(summary?.totalExpenses), icon: ReceiptText, accent: "red" as const },
    { label: dict.dashboard.totalSuppliers, value: summary?.totalSuppliers ?? 0, icon: UserCog, accent: "violet" as const },
    { label: dict.dashboard.totalIntervenants, value: summary?.totalIntervenants ?? 0, icon: UsersRound, accent: "slate" as const },
  ];

  // Client-derived alerts from already-fetched data.
  const alerts: { tone: "warning" | "info"; text: string }[] = [];
  if (summary) {
    if (outstanding.length > 0)
      alerts.push({ tone: "warning", text: `${outstanding.length} ${dict.dashboard.outstandingCommitments}` });
    if (summary.totalRemaining > 0)
      alerts.push({ tone: "warning", text: `${dict.dashboard.totalRemaining}: ${formatMAD(summary.totalRemaining)}` });
    if (summary.totalExpenses > summary.totalPaid)
      alerts.push({ tone: "info", text: `${dict.dashboard.totalExpenses} > ${dict.dashboard.totalPaid}` });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.dashboard.title}
        subtitle={
          summary
            ? `${summary.totalProjects} ${dict.nav.projects} · ${summary.totalIntervenants} ${dict.nav.intervenants}`
            : undefined
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            accent={k.accent}
            detailTone={k.detailTone}
            loading={loading}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title={dict.dashboard.totalPaid} subtitle="آخر 12 شهر" loading={loading} empty={!loading && payments.length === 0}>
          <TrendChart data={paymentsSeries} color="var(--chart-3)" type="area" />
        </ChartCard>
        <ChartCard title={dict.dashboard.totalExpenses} subtitle="آخر 12 شهر" loading={loading} empty={!loading && expenses.length === 0}>
          <TrendChart data={expensesSeries} color="var(--chart-1)" type="bar" />
        </ChartCard>
        <ChartCard title={dict.dashboard.totalCommitments} subtitle="آخر 12 شهر" loading={loading} empty={!loading && commitments.length === 0}>
          <TrendChart data={commitmentsSeries} color="var(--chart-2)" type="area" />
        </ChartCard>
      </div>

      {/* Recent payments + Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold">{dict.dashboard.recentPayments}</CardTitle>
            <Link href="/payments" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {dict.dashboard.viewAll}
              <ArrowLeft className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <SkeletonRows />
            ) : recentPayments.length === 0 ? (
              <EmptyRow text={dict.payments.noPayments} />
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <BanknoteArrowUp className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.project.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.commitment.description}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-sm font-bold">{formatMAD(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <TriangleAlert className="size-4 text-amber-500" />
            <CardTitle className="text-base font-bold">التنبيهات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <SkeletonRows rows={3} />
            ) : alerts.length === 0 ? (
              <EmptyRow text={dict.labels.noData} />
            ) : (
              alerts.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                    a.tone === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                      : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                  }`}
                >
                  {a.tone === "warning" ? <TriangleAlert className="size-4 shrink-0" /> : <CircleDollarSign className="size-4 shrink-0" />}
                  <span className="font-medium">{a.text}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top active projects + Outstanding commitments */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Activity className="size-4 text-primary" />
              {dict.status.inProgress} · {dict.nav.projects}
            </CardTitle>
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {dict.dashboard.viewAll}
              <ArrowLeft className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <SkeletonRows />
            ) : activeProjects.length === 0 ? (
              <EmptyRow text={dict.projects.noProjects} />
            ) : (
              activeProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Building2 className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.city ?? "-"}</p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold">{dict.dashboard.outstandingCommitments}</CardTitle>
            <Link href="/commitments" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {dict.dashboard.viewAll}
              <ArrowLeft className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <SkeletonRows />
            ) : outstanding.length === 0 ? (
              <EmptyRow text={dict.commitments.noCommitments} />
            ) : (
              outstanding.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.projectName}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.beneficiaryName || c.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold">{formatMAD(c.agreedAmount)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
