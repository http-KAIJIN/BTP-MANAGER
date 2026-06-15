"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Property, PaginatedResponse } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, FilterSelect, RowActions } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "ALL", label: dict.labels.all },
  { value: "DISPONIBLE", label: dict.properties.available },
  { value: "RESERVE", label: dict.properties.reserved },
  { value: "VENDU", label: dict.properties.sold },
];

const typeLabel = (t: string) =>
  (({ APPARTEMENT: dict.properties.apartment, LOCAL_COMMERCIAL: dict.properties.commercialSpace, BUREAU: dict.properties.office, ENTREPOT: dict.properties.warehouse }) as Record<string, string>)[t] || t;

export default function PropertiesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Property> | null>(null);
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
      .get<PaginatedResponse<Property>>("/real-estate/properties", {
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
      await api.delete(`/real-estate/properties/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<Property>[] = [
    { key: "ref", header: dict.properties.reference, cell: (p) => <span className="font-medium text-foreground">{p.reference}</span> },
    { key: "type", header: dict.properties.type, cell: (p) => typeLabel(p.type) },
    { key: "surface", header: dict.properties.surface, cell: (p) => `${Number(p.surface)} ${dict.units.m2}` },
    { key: "price", header: dict.properties.price, cell: (p) => formatMAD(Number(p.price)) },
    { key: "project", header: dict.properties.project, cell: (p) => p.project?.name || "-" },
    { key: "status", header: dict.properties.status, cell: (p) => <StatusBadge status={p.status} /> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (p) => <RowActions editHref={`/properties/${p.id}/edit`} onDelete={() => setDeleteId(p.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.properties.title}
        subtitle={`${data?.meta.total ?? 0} ${dict.labels.count}`}
        actions={
          <Button asChild>
            <Link href="/properties/new"><Plus className="size-4" />{dict.properties.new}</Link>
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
          onRowClick={(p) => router.push(`/properties/${p.id}`)}
          emptyText={dict.properties.noProperties}
          renderMobileCard={(p) => (
            <MobileCard href={`/properties/${p.id}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground truncate">{p.reference}</span>
                <StatusBadge status={p.status} />
              </div>
              <MobileCardRow label={dict.properties.type} value={typeLabel(p.type)} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{`${Number(p.surface)} ${dict.units.m2}`}</span>
                <span className="text-sm font-bold">{formatMAD(Number(p.price))}</span>
              </div>
              <MobileCardRow label={dict.properties.project} value={p.project?.name || "-"} />
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
