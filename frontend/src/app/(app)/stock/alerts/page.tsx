"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { StockDashboard } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { ErrorState } from "@/components/ui-kit/error-state";

type AlertRow = StockDashboard["lowStockItems"][number] & { severity: string; threshold: number };

export default function StockAlertsPage() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.get<StockDashboard>("/stock/dashboard").then((d) => setRows(d.lowStockItems.map((m) => ({ ...m, threshold: m.minQty, severity: m.currentQty <= 0 ? "CRITICAL" : m.currentQty <= m.minQty / 2 ? "HIGH" : "LOW" })))).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const columns: Column<AlertRow>[] = [
    { key: "material", header: dict.stock.material, cell: (m) => <span className="font-medium text-foreground">{m.name}</span> },
    { key: "current", header: dict.stock.currentQty, className: "text-end", cell: (m) => `${m.currentQty} ${m.unit}` },
    { key: "threshold", header: dict.stock.minQty, className: "text-end", cell: (m) => `${m.threshold} ${m.unit}` },
    { key: "severity", header: dict.labels.status, className: "text-end", cell: (m) => <span className={m.severity === "CRITICAL" ? "font-bold text-destructive" : m.severity === "HIGH" ? "font-semibold text-orange-600" : "font-medium text-amber-600"}>{m.severity}</span> },
  ];
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><PageHeader title={dict.stock.lowStockItems} />{error ? <ErrorState message={error} /> : <DataTable columns={columns} data={rows} loading={loading} rowKey={(m) => m.id} emptyText={dict.labels.noData} renderMobileCard={(m) => <MobileCard><span className="block truncate text-sm font-bold text-foreground">{m.name}</span><MobileCardRow label={dict.stock.currentQty} value={`${m.currentQty} ${m.unit}`} /><MobileCardRow label={dict.stock.minQty} value={`${m.threshold} ${m.unit}`} /><MobileCardRow label={dict.labels.status} value={m.severity} /></MobileCard>} />}</div>;
}
