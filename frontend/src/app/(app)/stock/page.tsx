"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, Layers, TrendingUp } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { MaterialCatalog, MaterialCategory, PaginatedResponse, StockDashboard } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockPage() {
  const [dashboard, setDashboard] = useState<StockDashboard | null>(null);
  const [materials, setMaterials] = useState<MaterialCatalog[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<StockDashboard>("/stock/dashboard"),
      api.get<PaginatedResponse<MaterialCatalog>>("/stock/materials", { limit: "500" }),
      api.get<MaterialCategory[]>("/stock/categories"),
    ]).then(([d, m, c]) => { setDashboard(d); setMaterials(m.data); setCategories(c); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const columns: Column<MaterialCatalog>[] = [
    { key: "name", header: dict.stock.material, cell: (m) => <span className="font-medium text-foreground">{m.name}</span> },
    { key: "category", header: dict.stock.category, cell: (m) => m.category?.name || "-" },
    { key: "qty", header: dict.stock.currentQty, className: "text-end", cell: (m) => `${Number(m.currentQty).toLocaleString("fr-FR")} ${m.unit}` },
    { key: "min", header: dict.stock.minQty, className: "text-end", cell: (m) => Number(m.minQty).toLocaleString("fr-FR") },
    { key: "value", header: dict.stock.stockValue, className: "text-end font-medium", cell: (m) => formatMAD(Number(m.currentQty) * Number(m.unitPrice || 0)) },
  ];

  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><PageHeader title={dict.stock.title} actions={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/stock/alerts">{dict.stock.lowStock}</Link></Button><Button asChild><Link href="/stock/movements">{dict.stock.movements}</Link></Button></div>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label={dict.stock.stockValue} value={formatMAD(dashboard?.totalStockValue || 0)} icon={Boxes} loading={loading} /><KpiCard label={dict.stock.lowStock} value={dashboard?.lowStockCount ?? 0} icon={AlertTriangle} loading={loading} /><KpiCard label={dict.stock.materials} value={materials.length} icon={Layers} loading={loading} /><KpiCard label={dict.stock.categories} value={categories.length} icon={TrendingUp} loading={loading} /></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>{dict.stock.lowStockItems}</CardTitle></CardHeader><CardContent className="space-y-3">{dashboard?.lowStockItems.length ? dashboard.lowStockItems.map((m) => <div key={m.id} className="flex items-center justify-between rounded-lg border p-3"><div><div className="font-medium">{m.name}</div><div className="text-sm text-muted-foreground">{m.currentQty} / {m.minQty} {m.unit}</div></div><span className="text-sm font-semibold text-destructive">{dict.stock.lowStock}</span></div>) : <p className="text-sm text-muted-foreground">{dict.labels.noData}</p>}</CardContent></Card><Card><CardHeader><CardTitle>{dict.stock.mostConsumed}</CardTitle></CardHeader><CardContent className="space-y-3">{dashboard?.mostUsedMaterials.length ? dashboard.mostUsedMaterials.map((m) => <div key={m.materialId} className="flex items-center justify-between rounded-lg border p-3"><span className="font-medium">{m.materialName}</span><span className="text-sm text-muted-foreground">{m.totalConsumed} {m.unit}</span></div>) : <p className="text-sm text-muted-foreground">{dict.labels.noData}</p>}</CardContent></Card></div>
    <DataTable columns={columns} data={materials} loading={loading} rowKey={(m) => m.id} emptyText={dict.stock.noMaterials} renderMobileCard={(m) => <MobileCard><span className="block truncate text-sm font-bold text-foreground">{m.name}</span><MobileCardRow label={dict.stock.category} value={m.category?.name || "-"} /><MobileCardRow label={dict.stock.currentQty} value={`${Number(m.currentQty)} ${m.unit}`} /><MobileCardRow label={dict.stock.stockValue} value={formatMAD(Number(m.currentQty) * Number(m.unitPrice || 0))} /></MobileCard>} />
  </div>;
}
