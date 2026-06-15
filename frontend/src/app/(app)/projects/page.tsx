"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Project, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, FilterSelect, RowActions } from "@/components/ui-kit/list-controls";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "ALL", label: dict.projects.allStatuses },
  { value: "DRAFT", label: dict.status.notStarted },
  { value: "ACTIVE", label: dict.status.active },
  { value: "PAUSED", label: dict.status.onHold },
  { value: "COMPLETED", label: dict.status.completed },
  { value: "ARCHIVED", label: dict.status.archived },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Project> | null>(null);
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
      .get<PaginatedResponse<Project>>("/projects", {
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
      await api.delete(`/projects/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const owner = (p: Project) =>
    p.ownershipType === "internal_company" ? p.ownerCompany?.name || "-" : p.externalClientName || dict.labels.noData;

  const columns: Column<Project>[] = [
    { key: "name", header: dict.projects.name, cell: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    { key: "city", header: dict.projects.city, cell: (p) => p.city || "-" },
    { key: "status", header: dict.projects.status, cell: (p) => <StatusBadge status={p.status} /> },
    { key: "owner", header: dict.projects.ownerCompany, cell: owner },
    { key: "exec", header: dict.projects.executingCompany, cell: (p) => p.executingCompany?.name || "-" },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (p) => <RowActions editHref={`/projects/${p.id}/edit`} onDelete={() => setDeleteId(p.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.projects.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.projects.title}`}
        actions={
          <Button asChild>
            <Link href="/projects/new"><Plus className="size-4" />{dict.projects.new}</Link>
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
          onRowClick={(p) => router.push(`/projects/${p.id}`)}
          emptyText={dict.projects.noProjects}
          total={data?.meta.total}
          page={data?.meta.page}
          pageCount={data?.meta.totalPages}
          onPageChange={setPage}
          toolbar={
            <TableToolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder={dict.projects.search}>
              <FilterSelect value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
            </TableToolbar>
          }
        />
      )}
      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
