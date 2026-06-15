"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Supplier, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, FilterSelect, RowActions } from "@/components/ui-kit/list-controls";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";

const STATUS_OPTIONS = [
  { value: "ALL", label: dict.labels.all },
  { value: "ACTIVE", label: dict.status.active },
  { value: "ARCHIVED", label: dict.status.archived },
];

export default function SuppliersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Supplier> | null>(null);
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
      .get<PaginatedResponse<Supplier>>("/suppliers", {
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
      await api.delete(`/suppliers/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Supplier>[] = [
    { key: "name", header: dict.suppliers.name, cell: (s) => <span className="font-medium text-foreground">{s.name}</span> },
    { key: "phone", header: dict.suppliers.phone, cell: (s) => s.phone || "-" },
    { key: "category", header: dict.suppliers.category, cell: (s) => s.category || "-" },
    { key: "status", header: dict.suppliers.status, cell: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (s) => <RowActions editHref={`/suppliers/${s.id}/edit`} onDelete={() => setDeleteId(s.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.suppliers.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.suppliers.title}`}
        actions={
          <Button asChild>
            <Link href="/suppliers/new"><Plus className="size-4" />{dict.suppliers.new}</Link>
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
          onRowClick={(s) => router.push(`/suppliers/${s.id}`)}
          emptyText={dict.suppliers.noSuppliers}
          renderMobileCard={(s) => (
            <MobileCard href={`/suppliers/${s.id}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground truncate">{s.name}</span>
                <StatusBadge status={s.status} />
              </div>
              <MobileCardRow label={dict.suppliers.phone} value={s.phone} />
              <MobileCardRow label={dict.suppliers.category} value={s.category} />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Link href={`/suppliers/${s.id}/edit`} onClick={(e) => e.stopPropagation()} className="text-xs font-medium text-primary hover:underline">{dict.actions.edit}</Link>
              </div>
            </MobileCard>
          )}
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
