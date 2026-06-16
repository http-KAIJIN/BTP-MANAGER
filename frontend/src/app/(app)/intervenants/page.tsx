"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Intervenant, PaginatedResponse } from "@/lib/types";
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

export default function IntervenantsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Intervenant> | null>(null);
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
      .get<PaginatedResponse<Intervenant>>("/intervenants", {
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
      await api.delete(`/intervenants/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Intervenant>[] = [
    { key: "name", header: dict.intervenants.name, cell: (i) => <span className="font-medium text-foreground">{i.name}</span> },
    { key: "phone", header: dict.intervenants.phone, cell: (i) => i.phone || "-" },
    { key: "trade", header: dict.intervenants.trade, cell: (i) => i.trade ?? "-" },
    { key: "status", header: dict.intervenants.status, cell: (i) => <StatusBadge status={i.status} /> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (i) => <RowActions editHref={`/intervenants/${i.id}/edit`} onDelete={() => setDeleteId(i.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.intervenants.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.intervenants.title}`}
        actions={
          <Button asChild>
            <Link href="/intervenants/new"><Plus className="size-4" />{dict.intervenants.new}</Link>
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
          rowKey={(i) => i.id}
          onRowClick={(i) => router.push(`/intervenants/${i.id}`)}
          emptyText={dict.intervenants.noIntervenants}
          renderMobileCard={(i) => (
            <MobileCard href={`/intervenants/${i.id}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground truncate">{i.name}</span>
                <StatusBadge status={i.status} />
              </div>
              <MobileCardRow label={dict.intervenants.phone} value={i.phone} />
              <MobileCardRow label={dict.intervenants.trade} value={i.trade} />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Link href={`/intervenants/${i.id}/edit`} onClick={(e) => e.stopPropagation()} className="text-xs font-medium text-primary hover:underline">{dict.actions.edit}</Link>
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
