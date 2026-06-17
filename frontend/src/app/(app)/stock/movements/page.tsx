"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate, formatMAD } from "@/lib/format";
import type { PaginatedResponse, StockMovement } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function StockMovementsPage() {
  const [data, setData] = useState<PaginatedResponse<StockMovement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => { setLoading(true); api.get<PaginatedResponse<StockMovement>>("/stock/movements", { page: String(page) }).then((res) => setData(search ? { ...res, data: res.data.filter((m) => `${m.material.name} ${m.reference || ""}`.toLowerCase().includes(search.toLowerCase())) } : res)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [search, page]);
  const columns: Column<StockMovement>[] = [
    { key: "date", header: dict.stock.date, cell: (m) => formatDate(m.createdAt) },
    { key: "material", header: dict.stock.material, cell: (m) => <span className="font-medium text-foreground">{m.material.name}</span> },
    { key: "type", header: dict.stock.type, cell: (m) => <StatusBadge status={m.type} /> },
    { key: "qty", header: dict.stock.quantity, className: "text-end", cell: (m) => `${Number(m.quantity).toLocaleString("fr-FR")} ${m.material.unit}` },
    { key: "total", header: dict.labels.total, className: "text-end font-medium", cell: (m) => m.totalCost ? formatMAD(Number(m.totalCost)) : "-" },
  ];
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><PageHeader title={dict.stock.movements} />{error ? <ErrorState message={error} /> : <DataTable columns={columns} data={data?.data} loading={loading} rowKey={(m) => m.id} emptyText={dict.stock.noMovements} total={data?.meta.total} page={data?.meta.page} pageCount={data?.meta.totalPages} onPageChange={setPage} toolbar={<TableToolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />} renderMobileCard={(m) => <MobileCard><span className="block truncate text-sm font-bold text-foreground">{m.material.name}</span><MobileCardRow label={dict.stock.type} value={m.type} /><MobileCardRow label={dict.stock.quantity} value={`${Number(m.quantity)} ${m.material.unit}`} /><MobileCardRow label={dict.labels.total} value={m.totalCost ? formatMAD(Number(m.totalCost)) : "-"} /></MobileCard>} />}</div>;
}
