"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Payment, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, RowActions } from "@/components/ui-kit/list-controls";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

function modeLabel(m: string) {
  return m === "CASH" ? dict.payments.cash : m === "CHEQUE" ? dict.payments.cheque : dict.payments.bankTransfer;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Payment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<Payment>>("/payments", { search: search || undefined, page: String(page) })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/payments/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Payment>[] = [
    { key: "project", header: dict.payments.project, cell: (p) => <span className="font-medium text-foreground">{p.project?.name || "-"}</span> },
    { key: "commitment", header: dict.payments.commitment, className: "max-w-[220px] truncate", cell: (p) => p.commitment?.description || "-" },
    { key: "amount", header: dict.payments.amount, cell: (p) => <span className="font-medium">{formatMAD(p.amount)}</span> },
    { key: "mode", header: dict.payments.paymentMode, cell: (p) => modeLabel(p.paymentMode) },
    { key: "date", header: dict.payments.paymentDate, cell: (p) => formatDate(p.paymentDate) },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (p) => <RowActions editHref={`/payments/${p.id}/edit`} onDelete={() => setDeleteId(p.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.payments.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.payments.title}`}
        actions={
          <Button asChild>
            <Link href="/payments/new"><Plus className="size-4" />{dict.payments.new}</Link>
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
          rowKey={(p) => p.id}
          onRowClick={(p) => router.push(`/payments/${p.id}`)}
          emptyText={dict.payments.noPayments}
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
