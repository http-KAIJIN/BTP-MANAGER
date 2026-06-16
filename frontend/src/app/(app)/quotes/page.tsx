"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Quote, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, RowActions } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

export default function QuotesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Quote> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<Quote>>("/quotes", { search: search || undefined, page: String(page) })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/quotes/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Quote>[] = [
    { key: "number", header: dict.quotes.number, cell: (q) => <span className="font-medium text-foreground">{q.quoteNumber}</span> },
    { key: "client", header: dict.quotes.client, cell: (q) => q.client.name },
    { key: "date", header: dict.quotes.date, cell: (q) => formatDate(q.quoteDate) },
    { key: "status", header: dict.labels.status, cell: (q) => <StatusBadge status={q.status} /> },
    { key: "total", header: dict.labels.total, cell: (q) => <span className="font-medium">{formatMAD(Number(q.totalTTC))}</span> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (q) => <RowActions editHref={`/quotes/${q.id}/edit`} onDelete={() => setDeleteId(q.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.quotes.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.labels.count}`}
        actions={
          <Button asChild>
            <Link href="/quotes/new"><Plus className="size-4" />{dict.quotes.new}</Link>
          </Button>
        }
      />
      {error ? <ErrorState message={error} /> : (
        <DataTable
          columns={columns}
          data={data?.data}
          loading={loading}
          rowKey={(q) => q.id}
          onRowClick={(q) => router.push(`/quotes/${q.id}`)}
          emptyText={dict.quotes.noQuotes}
          renderMobileCard={(q) => (
            <MobileCard href={`/quotes/${q.id}`}>
              <span className="text-sm font-bold text-foreground block truncate">{q.quoteNumber}</span>
              <MobileCardRow label={dict.quotes.client} value={q.client.name} />
              <MobileCardRow label={dict.labels.total} value={formatMAD(Number(q.totalTTC))} />
              <div dir="ltr" className="flex items-center justify-between gap-2 pt-1">
                <StatusBadge status={q.status} />
                <span className="text-xs text-muted-foreground">{formatDate(q.quoteDate)}</span>
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
