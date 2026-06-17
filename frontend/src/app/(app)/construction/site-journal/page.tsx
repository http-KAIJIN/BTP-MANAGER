"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import type { SiteJournal, PaginatedResponse, Project } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { FilterSelect } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

export default function SiteJournalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PaginatedResponse<SiteJournal> | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get<{ data: Project[] }>("/projects", { limit: "200" })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) { setData(null); setLoading(false); return; }
    setLoading(true);
    api.get<PaginatedResponse<SiteJournal>>("/construction/journals", { projectId, page: String(page) })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, page]);

  const columns: Column<SiteJournal>[] = [
    { key: "date", header: dict.site.date, cell: (j) => formatDate(j.date) },
    { key: "weather", header: dict.site.weather, cell: (j) => j.weather || "-" },
    { key: "progress", header: dict.site.progress, cell: (j) => `${j.progress}%` },
    { key: "summary", header: dict.site.summary, cell: (j) => j.summary?.slice(0, 60) || "-" },
    { key: "photos", header: dict.site.photos, cell: (j) => `${j.photos?.length || 0}` },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.site.journal}
        subtitle={data?.meta.total ? `${data.meta.total} ${dict.labels.count}` : undefined}
        actions={
          projectId ? (
            <Button asChild>
              <Link href={`/construction/site-journal/new?projectId=${projectId}`}><Plus className="size-4" />{dict.site.newJournal}</Link>
            </Button>
          ) : null
        }
      />
      <FilterSelect
        options={[{ value: "", label: dict.labels.all }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
        value={projectId}
        onValueChange={(v) => { setProjectId(v); setPage(1); }}
      />
      {error ? <ErrorState message={error} /> : !projectId ? (
        <ErrorState message={dict.errors.required} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data}
          loading={loading}
          rowKey={(j) => j.id}
          onRowClick={(j) => router.push(`/construction/site-journal/${j.id}`)}
          emptyText={dict.site.noJournals}
          renderMobileCard={(j) => (
            <MobileCard href={`/construction/site-journal/${j.id}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{formatDate(j.date)}</span>
                <span className="text-xs font-medium text-muted-foreground">{j.progress}%</span>
              </div>
              <MobileCardRow label={dict.site.weather} value={j.weather || "-"} />
              <MobileCardRow label={dict.site.summary} value={j.summary?.slice(0, 80) || "-"} />
            </MobileCard>
          )}
          total={data?.meta.total}
          page={data?.meta.page}
          pageCount={data?.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
