import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";

/** Back link shown above a detail header (RTL-aware arrow). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      <ArrowRight className="size-4" />
      {label}
    </Link>
  );
}

/** Titled card wrapping a 2-column definition grid. */
export function DetailCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

export function InfoItem({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value || "-"}</dd>
    </div>
  );
}

interface FinancialLike {
  totalCommitments: number;
  totalPaid: number;
  totalRemaining: number;
  totalExpenses?: number;
}

/** Reusable financial summary panel (commitments / paid / remaining / expenses). */
export function FinancialSummaryCard({ summary, title }: { summary: FinancialLike | null; title?: string }) {
  const rows: { label: string; value: number; tone: string }[] = summary
    ? [
        { label: dict.financial.totalCommitments, value: summary.totalCommitments, tone: "bg-muted text-foreground" },
        { label: dict.financial.totalPaid, value: summary.totalPaid, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
        { label: dict.financial.totalRemaining, value: summary.totalRemaining, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
        ...(summary.totalExpenses != null
          ? [{ label: dict.financial.totalExpenses, value: summary.totalExpenses, tone: "bg-red-500/10 text-red-600 dark:text-red-400" }]
          : []),
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">{title ?? dict.projects.financialSummary}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary ? (
          rows.map((r) => (
            <div key={r.label} className={cn("rounded-xl p-4", r.tone)}>
              <div className="text-xs font-medium opacity-80">{r.label}</div>
              <div className="mt-0.5 text-xl font-bold">{formatMAD(r.value)}</div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{dict.actions.loading}</p>
        )}
      </CardContent>
    </Card>
  );
}
