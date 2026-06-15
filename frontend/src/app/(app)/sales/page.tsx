"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Sale, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, FilterSelect, RowActions } from "@/components/ui-kit/list-controls";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "ALL", label: dict.labels.all },
  { value: "EN_COURS", label: dict.sales.inProgress },
  { value: "TERMINE", label: dict.sales.completed },
  { value: "ANNULE", label: dict.sales.cancelled },
];

export default function SalesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Sale> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<Sale>>("/real-estate/sales", {
        search: search || undefined,
        status: status === "ALL" ? undefined : status,
        page: String(page),
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, status, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/real-estate/sales/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Sale>[] = [
    { key: "client", header: dict.sales.client, cell: (s) => <span className="font-medium text-foreground">{s.client?.name || "-"}</span> },
    { key: "property", header: dict.sales.property, cell: (s) => s.property?.reference || "-" },
    { key: "price", header: dict.sales.salePrice, cell: (s) => formatMAD(Number(s.salePrice)) },
    { key: "date", header: dict.labels.date, cell: (s) => formatDate(s.saleDate) },
    { key: "status", header: dict.sales.status, cell: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (s) => <RowActions editHref={`/sales/${s.id}/edit`} onDelete={() => setDeleteId(s.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.sales.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.labels.count}`}
        actions={
          <Button asChild>
            <Link href="/sales/new"><Plus className="size-4" />{dict.sales.new}</Link>
          </Button>
        }
      />
      {error ? (
        <ErrorState message={error} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data}
          loading={loading}
          rowKey={(s) => s.id}
          onRowClick={(s) => router.push(`/sales/${s.id}`)}
          emptyText={dict.sales.noSales}
          total={data?.meta.total}
          page={data?.meta.page}
          pageCount={data?.meta.totalPages}
          onPageChange={setPage}
          toolbar={
            <TableToolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}>
              <FilterSelect value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
            </TableToolbar>
          }
        />
      )}
      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
