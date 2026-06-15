"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Company, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, FilterSelect, RowActions } from "@/components/ui-kit/list-controls";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "ALL", label: dict.labels.all },
  { value: "ACTIVE", label: dict.status.active },
  { value: "ARCHIVED", label: dict.status.archived },
];

export default function CompaniesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Company> | null>(null);
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
      .get<PaginatedResponse<Company>>("/companies", {
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
      await api.delete(`/companies/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Company>[] = [
    { key: "name", header: dict.companies.name, cell: (c) => <span className="font-medium text-foreground">{c.name}</span> },
    { key: "ice", header: dict.companies.ICE, cell: (c) => c.ice || "-" },
    { key: "phone", header: dict.companies.phone, cell: (c) => c.phone || "-" },
    { key: "manager", header: dict.companies.managerName, cell: (c) => c.managerName || "-" },
    { key: "status", header: dict.companies.status, cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (c) => <RowActions editHref={`/companies/${c.id}/edit`} onDelete={() => setDeleteId(c.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.companies.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.companies.title}`}
        actions={
          <Button asChild>
            <Link href="/companies/new"><Plus className="size-4" />{dict.companies.new}</Link>
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
          onRowClick={(c) => router.push(`/companies/${c.id}`)}
          emptyText={dict.companies.noCompanies}
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
