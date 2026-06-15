"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Expense, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, RowActions } from "@/components/ui-kit/list-controls";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

function modeLabel(m: string) {
  return m === "CASH" ? dict.expenses.cash : m === "CHEQUE" ? dict.expenses.cheque : dict.expenses.bankTransfer;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Expense> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<Expense>>("/expenses", { search: search || undefined, page: String(page) })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/expenses/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Expense>[] = [
    { key: "project", header: dict.expenses.project, cell: (e) => <span className="font-medium text-foreground">{e.project?.name || "-"}</span> },
    { key: "category", header: dict.expenses.category, cell: (e) => e.category?.name || "-" },
    { key: "desc", header: dict.expenses.description, className: "max-w-[220px] truncate", cell: (e) => e.description },
    { key: "amount", header: dict.expenses.amount, cell: (e) => <span className="font-medium">{formatMAD(e.amount)}</span> },
    { key: "date", header: dict.expenses.expenseDate, cell: (e) => formatDate(e.expenseDate) },
    { key: "mode", header: dict.financial.paymentMode, cell: (e) => modeLabel(e.paymentMode) },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (e) => <RowActions editHref={`/expenses/${e.id}/edit`} onDelete={() => setDeleteId(e.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.expenses.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.expenses.title}`}
        actions={
          <Button asChild>
            <Link href="/expenses/new"><Plus className="size-4" />{dict.expenses.new}</Link>
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
          rowKey={(e) => e.id}
          onRowClick={(e) => router.push(`/expenses/${e.id}`)}
          emptyText={dict.expenses.noExpenses}
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
