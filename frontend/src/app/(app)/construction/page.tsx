"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HardHat } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Project, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectProgress {
  projectId: string;
  globalProgress: number;
}

export default function ConstructionPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<PaginatedResponse<Project>>("/projects", { limit: "100" })
      .then(async (res) => {
        setProjects(res.data);
        const results = await Promise.all(
          res.data.map(async (p) => {
            try {
              const prog = await api.get<ProjectProgress>(`/construction/projects/${p.id}/progress`);
              return { id: p.id, progress: prog.globalProgress };
            } catch {
              return { id: p.id, progress: 0 };
            }
          }),
        );
        const map: Record<string, number> = {};
        results.forEach((r) => { map[r.id] = r.progress; });
        setProgressMap(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text={dict.actions.loading} />;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.construction.title} subtitle={dict.construction.projectProgress} />
      {error ? (
        <ErrorState message={error} />
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <HardHat className="size-8" />
            <p>
              {dict.construction.noProjects}{" "}
              <Link href="/projects/new" className="text-primary hover:underline">{dict.projects.new}</Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const progress = progressMap[p.id] ?? 0;
            return (
              <Link key={p.id} href={`/construction/${p.id}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold">{p.name}</div>
                        <div className="truncate text-sm text-muted-foreground">{p.city}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{dict.construction.progress}</span>
                        <span className="font-semibold tabular-nums">{progress}{dict.units.percent}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
