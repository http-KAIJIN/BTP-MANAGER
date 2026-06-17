"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import type { GoodsReceipt, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

export default function GoodsReceiptsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<GoodsReceipt> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get<PaginatedResponse<GoodsReceipt>>("/goods-receipts", { page: String(page) })
      .then((res) => setData(search ? { ...res, data: res.data.filter((r) => `${r.receiptNumber} ${r.order.orderNumber}`.toLowerCase().includes(search.toLowerCase())) } : res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await api.delete(`/goods-receipts/${deleteId}`); setDeleteId(null); fetchData(); } catch (e: unknown) { alert(e instanceof Error ? e.message : dict.errors.deleteFailed); }
    setDeleting(false);
  };

  const columns: Column<GoodsReceipt>[] = [
    { key: "number", header: dict.goodsReceipts.number, cell: (r) => <span className="font-medium text-foreground">{r.receiptNumber}</span> },
    { key: "order", header: dict.goodsReceipts.order, cell: (r) => r.order.orderNumber },
    { key: "project", header: dict.goodsReceipts.project, cell: (r) => r.project?.name || "-" },
    { key: "date", header: dict.goodsReceipts.receiptDate, cell: (r) => formatDate(r.receiptDate) },
    { key: "status", header: dict.labels.status, cell: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: dict.labels.actions, headerClassName: "text-end", className: "text-end", cell: (r) => <Button variant="outline" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}>{dict.actions.delete}</Button> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.goodsReceipts.title} subtitle={`${data?.meta.total ?? 0} ${dict.labels.count}`} actions={<Button asChild><Link href="/goods-receipts/new"><Plus className="size-4" />{dict.goodsReceipts.new}</Link></Button>} />
      {error ? <ErrorState message={error} /> : <DataTable columns={columns} data={data?.data} loading={loading} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/goods-receipts/${r.id}`)} emptyText={dict.goodsReceipts.noReceipts} renderMobileCard={(r) => <MobileCard href={`/goods-receipts/${r.id}`}><span className="block truncate text-sm font-bold text-foreground">{r.receiptNumber}</span><MobileCardRow label={dict.goodsReceipts.order} value={r.order.orderNumber} /><MobileCardRow label={dict.goodsReceipts.project} value={r.project?.name || "-"} /><div dir="ltr" className="flex items-center justify-between gap-2 pt-1"><StatusBadge status={r.status} /><span className="text-xs text-muted-foreground">{formatDate(r.receiptDate)}</span></div></MobileCard>} total={data?.meta.total} page={data?.meta.page} pageCount={data?.meta.totalPages} onPageChange={setPage} toolbar={<TableToolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />} />}
      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
