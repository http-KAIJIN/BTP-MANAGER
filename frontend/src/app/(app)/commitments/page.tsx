"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Commitment, PaginatedResponse } from "@/lib/types";
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
  { value: "OPEN", label: dict.status.open },
  { value: "PARTIALLY_PAID", label: dict.status.partiallyPaid },
  { value: "PAID", label: dict.status.paid },
  { value: "CANCELLED", label: dict.status.cancelled },
];

export default function CommitmentsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Commitment> | null>(null);
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
      .get<PaginatedResponse<Commitment>>("/commitments", {
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
      await api.delete(`/commitments/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Commitment>[] = [
    { key: "project", header: dict.commitments.project, cell: (c) => <span className="font-medium text-foreground">{c.project?.name || "-"}</span> },
    { key: "ben", header: dict.commitments.beneficiary, cell: (c) => c.supplier?.name || c.intervenant?.name || "-" },
    { key: "desc", header: dict.commitments.description, className: "max-w-[220px] truncate", cell: (c) => c.description },
    { key: "amount", header: dict.financial.amount, cell: (c) => <span className="font-medium">{formatMAD(c.agreedAmount)}</span> },
    { key: "status", header: dict.commitments.status, cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (c) => <RowActions editHref={`/commitments/${c.id}/edit`} onDelete={() => setDeleteId(c.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.commitments.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.commitments.title}`}
        actions={
          <Button asChild>
            <Link href="/commitments/new"><Plus className="size-4" />{dict.commitments.new}</Link>
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
          rowKey={(c) => c.id}
          onRowClick={(c) => router.push(`/commitments/${c.id}`)}
          emptyText={dict.commitments.noCommitments}
          renderMobileCard={(c) => (
            <MobileCard href={`/commitments/${c.id}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground truncate">{c.project?.name || "-"}</span>
                <StatusBadge status={c.status} />
              </div>
              <MobileCardRow label={dict.commitments.beneficiary} value={c.supplier?.name || c.intervenant?.name || "-"} />
              <MobileCardRow label={dict.financial.amount} value={formatMAD(c.agreedAmount)} />
              <p className="text-xs text-muted-foreground truncate">{c.description}</p>
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
