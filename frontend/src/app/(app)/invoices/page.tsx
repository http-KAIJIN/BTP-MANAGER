"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Invoice, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, RowActions } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

export default function InvoicesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<Invoice>>("/invoices", { search: search || undefined, page: String(page) })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/invoices/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const statusLabel = (inv: Invoice): string => {
    if (inv.status === "PAID") return dict.invoices.status_paid;
    if (inv.status === "PARTIALLY_PAID") return dict.invoices.status_partially_paid;
    if (inv.status === "SENT") return dict.invoices.status_sent;
    if (inv.status === "DRAFT") return dict.invoices.status_draft;
    if (inv.status === "CANCELLED") return dict.invoices.status_cancelled;
    return inv.status;
  };

  const columns: Column<Invoice>[] = [
    { key: "number", header: dict.invoices.number, cell: (inv) => <span className="font-medium text-foreground">{inv.invoiceNumber}</span> },
    { key: "client", header: dict.invoices.client, cell: (inv) => inv.client.name },
    { key: "date", header: dict.invoices.date, cell: (inv) => formatDate(inv.invoiceDate) },
    { key: "status", header: dict.labels.status, cell: (inv) => <StatusBadge status={inv.status} /> },
    { key: "total", header: dict.invoices.totalTTC, className: "text-end", cell: (inv) => <span className="font-medium">{formatMAD(Number(inv.totalTTC))}</span> },
    { key: "paid", header: dict.invoices.paidAmount, className: "text-end", cell: (inv) => <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatMAD(Number(inv.paidAmount))}</span> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (inv) => <RowActions editHref={`/invoices/${inv.id}/edit`} onDelete={() => setDeleteId(inv.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.invoices.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.labels.count}`}
        actions={
          <Button asChild>
            <Link href="/invoices/new"><Plus className="size-4" />{dict.invoices.new}</Link>
          </Button>
        }
      />
      {error ? <ErrorState message={error} /> : (
        <DataTable
          columns={columns}
          data={data?.data}
          loading={loading}
          rowKey={(inv) => inv.id}
          onRowClick={(inv) => router.push(`/invoices/${inv.id}`)}
          emptyText={dict.invoices.noInvoices}
          renderMobileCard={(inv) => (
            <MobileCard href={`/invoices/${inv.id}`}>
              <span className="text-sm font-bold text-foreground block truncate">{inv.invoiceNumber}</span>
              <MobileCardRow label={dict.invoices.client} value={inv.client.name} />
              <MobileCardRow label={dict.invoices.totalTTC} value={formatMAD(Number(inv.totalTTC))} />
              <div dir="ltr" className="flex items-center justify-between gap-2 pt-1">
                <StatusBadge status={inv.status} />
                <span className="text-xs text-muted-foreground">{formatDate(inv.invoiceDate)}</span>
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
