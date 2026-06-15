"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Client, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, RowActions } from "@/components/ui-kit/list-controls";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

export default function ClientsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<Client>>("/clients", {
        search: search || undefined,
        page: String(page),
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/clients/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Client>[] = [
    { key: "name", header: dict.clients.name, cell: (c) => <span className="font-medium text-foreground">{c.name}</span> },
    { key: "phone", header: dict.clients.phone, cell: (c) => c.phone || "-" },
    { key: "cin", header: dict.clients.CIN, cell: (c) => c.cin || "-" },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (c) => <RowActions editHref={`/clients/${c.id}/edit`} onDelete={() => setDeleteId(c.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.clients.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.labels.count}`}
        actions={
          <Button asChild>
            <Link href="/clients/new"><Plus className="size-4" />{dict.clients.new}</Link>
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
          onRowClick={(c) => router.push(`/clients/${c.id}`)}
          emptyText={dict.clients.noClients}
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
