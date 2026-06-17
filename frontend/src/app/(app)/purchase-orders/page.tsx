"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate, formatMAD } from "@/lib/format";
import type { PaginatedResponse, PurchaseOrder } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, RowActions } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<PurchaseOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get<PaginatedResponse<PurchaseOrder>>("/purchase-orders", { search: search || undefined, page: String(page) })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/purchase-orders/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<PurchaseOrder>[] = [
    { key: "number", header: dict.purchaseOrders.number, cell: (po) => <span className="font-medium text-foreground">{po.orderNumber}</span> },
    { key: "supplier", header: dict.purchaseOrders.supplier, cell: (po) => po.supplier.name },
    { key: "date", header: dict.purchaseOrders.orderDate, cell: (po) => formatDate(po.orderDate) },
    { key: "status", header: dict.labels.status, cell: (po) => <StatusBadge status={po.status} /> },
    { key: "total", header: dict.labels.total, cell: (po) => <span className="font-medium">{formatMAD(Number(po.totalTTC))}</span> },
    { key: "actions", header: dict.labels.actions, headerClassName: "text-end", className: "text-end", cell: (po) => po.status === "DRAFT" ? <RowActions editHref={`/purchase-orders/${po.id}/edit`} onDelete={() => setDeleteId(po.id)} /> : <span className="text-muted-foreground">-</span> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.purchaseOrders.title} subtitle={`${data?.meta.total ?? 0} ${dict.labels.count}`} actions={<Button asChild><Link href="/purchase-orders/new"><Plus className="size-4" />{dict.purchaseOrders.new}</Link></Button>} />
      {error ? <ErrorState message={error} /> : (
        <DataTable
          columns={columns}
          data={data?.data}
          loading={loading}
          rowKey={(po) => po.id}
          onRowClick={(po) => router.push(`/purchase-orders/${po.id}`)}
          emptyText={dict.purchaseOrders.noOrders}
          renderMobileCard={(po) => (
            <MobileCard href={`/purchase-orders/${po.id}`}>
              <span className="block truncate text-sm font-bold text-foreground">{po.orderNumber}</span>
              <MobileCardRow label={dict.purchaseOrders.supplier} value={po.supplier.name} />
              <MobileCardRow label={dict.labels.total} value={formatMAD(Number(po.totalTTC))} />
              <div dir="ltr" className="flex items-center justify-between gap-2 pt-1">
                <StatusBadge status={po.status} />
                <span className="text-xs text-muted-foreground">{formatDate(po.orderDate)}</span>
              </div>
            </MobileCard>
          )}
          total={data?.meta.total}
          page={data?.meta.page}
          pageCount={data?.meta.totalPages}
          onPageChange={setPage}
          toolbar={<TableToolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />}
        />
      )}
      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
