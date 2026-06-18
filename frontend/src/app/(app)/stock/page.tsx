"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, Layers, RotateCw, TrendingUp } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate, formatMAD } from "@/lib/format";
import type { MaterialCatalog, PaginatedResponse, StockDashboard, StockMovement } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function materialPrice(material: MaterialCatalog) {
  return Number(material.purchasePriceHT ?? material.unitPrice ?? 0);
}

export default function StockPage() {
  const [dashboard, setDashboard] = useState<StockDashboard | null>(null);
  const [materials, setMaterials] = useState<MaterialCatalog[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<StockDashboard>("/stock/dashboard"),
      api.get<PaginatedResponse<MaterialCatalog>>("/stock/materials", { limit: "100", sortBy: "name", sortOrder: "asc" }),
      api.get<PaginatedResponse<StockMovement>>("/stock/movements", { limit: "5", sortBy: "createdAt", sortOrder: "desc" }).catch(() => null),
    ])
      .then(([d, m, movements]) => {
        setDashboard(d);
        setMaterials(m.data);
        setRecentMovements(d.recentMovements ?? movements?.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : dict.errors.loadFailed))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const columns: Column<MaterialCatalog>[] = [
    { key: "name", header: dict.stock.material, cell: (m) => <span className="font-medium text-foreground">{m.name}</span> },
    { key: "category", header: dict.stock.category, cell: (m) => m.category?.name || "-" },
    { key: "qty", header: dict.stock.currentQty, className: "text-end", cell: (m) => `${Number(m.currentQty).toLocaleString("fr-FR")} ${m.unit}` },
    { key: "min", header: dict.stock.minQty, className: "text-end", cell: (m) => Number(m.minQty).toLocaleString("fr-FR") },
    { key: "value", header: dict.stock.stockValue, className: "text-end font-medium", cell: (m) => formatMAD(Number(m.currentQty) * materialPrice(m)) },
  ];

  const totalMaterials = dashboard?.totalMaterials ?? materials.length;
  const totalStockValue = dashboard?.totalStockValue ?? materials.reduce((sum, material) => sum + Number(material.currentQty) * materialPrice(material), 0);
  const lowStockItems = dashboard?.lowStockItems ?? materials.filter((m) => Number(m.minQty) > 0 && Number(m.currentQty) <= Number(m.minQty)).map((m) => ({ id: m.id, name: m.name, unit: m.unit, currentQty: Number(m.currentQty), minQty: Number(m.minQty), unitPrice: materialPrice(m) }));
  const isEmpty = !loading && !error && materials.length === 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.stock.title} actions={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/stock/movements">{dict.stock.movements}</Link></Button><Button asChild><Link href="/construction/materials">{dict.stock.materialCatalog}</Link></Button></div>} />

      {error && <ErrorState message={error} onRetry={fetchData} retryLabel={dict.actions.retry} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={dict.stock.totalMaterials} value={totalMaterials} icon={Layers} loading={loading} />
        <KpiCard label={dict.stock.stockValue} value={formatMAD(totalStockValue)} icon={Boxes} loading={loading} />
        <KpiCard label={dict.stock.lowStockItems} value={lowStockItems.length} icon={AlertTriangle} loading={loading} />
        <KpiCard label={dict.stock.recentMovements} value={recentMovements.length} icon={TrendingUp} loading={loading} />
      </div>

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Boxes className="size-10 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-bold">{dict.stock.stockEmptyTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{dict.stock.stockEmptyDescription}</p>
            </div>
            <Button asChild><Link href="/construction/materials"><RotateCw className="size-4" />{dict.stock.newMaterial}</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{dict.stock.lowStockItems}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {lowStockItems.length ? lowStockItems.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="font-medium">{m.name}</div><div className="text-sm text-muted-foreground">{m.currentQty} / {m.minQty} {m.unit}</div></div>
                <span className="text-sm font-semibold text-destructive">{dict.stock.lowStock}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">{dict.labels.noData}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{dict.stock.recentMovements}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentMovements.length ? recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="font-medium">{movement.material.name}</div><div className="text-sm text-muted-foreground">{formatDate(movement.createdAt)}</div></div>
                <span className="text-sm text-muted-foreground">{Number(movement.quantity)} {movement.material.unit}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">{dict.stock.noMovements}</p>}
          </CardContent>
        </Card>
      </div>

      <DataTable columns={columns} data={materials} loading={loading} rowKey={(m) => m.id} emptyText={dict.stock.noMaterials} renderMobileCard={(m) => <MobileCard><span className="block truncate text-sm font-bold text-foreground">{m.name}</span><MobileCardRow label={dict.stock.category} value={m.category?.name || "-"} /><MobileCardRow label={dict.stock.currentQty} value={`${Number(m.currentQty)} ${m.unit}`} /><MobileCardRow label={dict.stock.stockValue} value={formatMAD(Number(m.currentQty) * materialPrice(m))} /></MobileCard>} />
    </div>
  );
}
