import { dict } from "@/lib/dict";

/** Format an amount as Moroccan Dirham, French grouping (e.g. "1 234 567 درهم"). */
export function formatMAD(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  return n.toLocaleString("fr-FR") + " " + dict.financial.MAD;
}

/** Compact MAD for tight spaces / chart axes (e.g. "1,2 M درهم"). */
export function formatMADCompact(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " M";
  if (abs >= 1_000) return (n / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " K";
  return n.toLocaleString("fr-FR");
}

/** Format a plain integer/count with French grouping. */
export function formatNumber(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("fr-FR");
}

/** Format an ISO date string as a short French date (dd/MM/yyyy). */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR");
}
