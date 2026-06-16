"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { CashFlow } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { ErrorState } from "@/components/ui-kit/error-state";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { ChartCard } from "@/components/ui-kit/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<CashFlow>("/finance/cash-flow")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!data) return null;

  // Aggregate forecast into weekly buckets for chart readability
  const weeklyData: { label: string; inflows: number; outflows: number; balance: number }[] = [];
  for (let i = 0; i < data.forecast.length; i += 7) {
    const week = data.forecast.slice(i, i + 7);
    const inflows = week.reduce((s, d) => s + d.inflows, 0);
    const outflows = week.reduce((s, d) => s + d.outflows, 0);
    const lastBalance = week[week.length - 1]?.runningBalance ?? 0;
    weeklyData.push({
      label: `S${Math.floor(i / 7) + 1}`,
      inflows,
      outflows,
      balance: lastBalance,
    });
  }

  const chartData = data.forecast.filter((_, i) => i % 5 === 0 || i === 29).map((d) => ({
    label: d.dayLabel.split(" ").slice(0, 2).join(" "),
    inflows: d.inflows,
    outflows: d.outflows,
    balance: d.runningBalance,
  }));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.finance.cashFlow} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label={dict.finance.cashPosition} value={formatMAD(data.cashPosition)} icon={Wallet} accent={data.cashPosition >= 0 ? "blue" : "red"} />
        <KpiCard label={dict.finance.expectedInflow} value={formatMAD(data.totalInflow30d)} icon={TrendingUp} accent="green" />
        <KpiCard label={dict.finance.expectedOutflow} value={formatMAD(data.totalOutflow30d)} icon={TrendingDown} accent="red" />
        <KpiCard label={dict.finance.expectedBalance} value={formatMAD(data.expectedBalance30d)} icon={BarChart3} accent={data.expectedBalance30d >= 0 ? "green" : "red"} />
      </div>

      {/* 30-Day Forecast Chart */}
      <ChartCard title={dict.finance.forecast30d} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" className="text-xs text-muted-foreground" />
            <YAxis className="text-xs text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
              formatter={(v) => formatMAD(Number(v))}
            />
            <Legend />
            <Bar dataKey="inflows" name={dict.finance.expectedInflow} fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflows" name={dict.finance.expectedOutflow} fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Upcoming Inflows */}
      {data.upcomingInflows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">{dict.finance.upcomingInflows}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.upcomingInflows.map((inf, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-emerald-500/5 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{inf.description}</p>
                    <p className="text-xs text-muted-foreground">{inf.project ?? ""} · {formatDate(inf.date)}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-3">{formatMAD(inf.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Outflows */}
      {data.upcomingOutflows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">{dict.finance.upcomingOutflows}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.upcomingOutflows.map((out, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-red-500/5 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{out.description}</p>
                    <p className="text-xs text-muted-foreground">{out.project} · {out.counterparty ?? ""} · {formatDate(out.date)}</p>
                  </div>
                  <span className="text-sm font-bold text-destructive whitespace-nowrap ml-3">{formatMAD(out.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
