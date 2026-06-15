/**
 * Client-side monthly aggregation for the dashboard charts.
 *
 * The backend exposes no monthly-trend endpoint and (per Phase 7 constraints) must not be
 * changed, so we derive the series in the browser from the existing list endpoints
 * (`/payments`, `/expenses`, `/commitments`). Those endpoints cap `limit` at 100, so this
 * reflects the most recent ~100 records per resource — an approximation that is accurate for
 * typical BTP datasets and degrades gracefully (older months simply read low) for very large ones.
 */

export interface MonthlyPoint {
  /** Sortable bucket key, e.g. "2026-03". */
  key: string;
  /** Short localized label for the axis, e.g. "mars". */
  label: string;
  /** Summed amount for the month. */
  total: number;
}

/** Build a continuous series for the last `months` months (oldest → newest). */
export function buildMonthlySeries<T>(
  records: T[] | undefined | null,
  dateField: keyof T,
  amountField: keyof T,
  months = 12,
): MonthlyPoint[] {
  const now = new Date();
  const buckets = new Map<string, MonthlyPoint>();

  // Seed the last N months so the chart is continuous even with gaps.
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      key,
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      total: 0,
    });
  }

  for (const r of records ?? []) {
    const raw = r[dateField];
    if (!raw) continue;
    const d = new Date(raw as string);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.total += Number(r[amountField] ?? 0);
  }

  return Array.from(buckets.values());
}
