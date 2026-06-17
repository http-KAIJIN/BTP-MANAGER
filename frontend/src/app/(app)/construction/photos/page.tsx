"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Trash2, Filter } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import type { Project, SiteJournalPhoto, PaginatedResponse } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FilterSelect } from "@/components/ui-kit/list-controls";
import { ErrorState } from "@/components/ui-kit/error-state";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface PhotoWithMeta extends SiteJournalPhoto {
  journalDate?: string;
}

export default function SitePhotosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [photos, setPhotos] = useState<PhotoWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoTypeFilter, setPhotoTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get<{ data: Project[] }>("/projects", { limit: "200" })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) { setPhotos([]); return; }
    setLoading(true);
    setError("");
    api.get<PaginatedResponse<{ id: string; date: string; photos: SiteJournalPhoto[] }>>("/construction/journals", { projectId, limit: "50", page: String(page) })
      .then((r) => {
        const all: PhotoWithMeta[] = [];
        for (const j of r.data) {
          for (const p of j.photos) {
            all.push({ ...p, journalDate: j.date });
          }
        }
        setPhotos(all);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, page]);

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/construction/photos/${photoId}`);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch {
      alert(dict.errors.deleteFailed);
    }
  };

  const filteredPhotos = photoTypeFilter === "ALL"
    ? photos
    : photos.filter((p) => p.photoType === photoTypeFilter);

  // Group by date
  const groupedByDate: Record<string, PhotoWithMeta[]> = {};
  for (const p of filteredPhotos) {
    const key = p.journalDate || p.createdAt?.slice(0, 10) || "unknown";
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(p);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.site.sitePhotos} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FilterSelect
            options={[{ value: "", label: dict.labels.all }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            value={projectId}
            onValueChange={(v) => { setProjectId(v); setPage(1); }}
          />
        </div>
        {projectId && (
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            {["ALL", "GENERAL", "BEFORE", "AFTER"].map((type) => (
              <Button
                key={type}
                variant={photoTypeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setPhotoTypeFilter(type)}
                className="text-xs"
              >
                {type === "ALL" ? dict.labels.all :
                 type === "GENERAL" ? dict.site.general :
                 type === "BEFORE" ? dict.site.before : dict.site.after}
              </Button>
            ))}
          </div>
        )}
      </div>

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner />}

      {!loading && !error && projectId && filteredPhotos.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">{dict.site.noPhotos}</p>
      )}

      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([dateKey, datePhotos]) => (
          <div key={dateKey}>
            <h3 className="mb-3 text-sm font-bold text-muted-foreground">{formatDate(dateKey)}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {datePhotos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={`${API_BASE}/construction/photos/${photo.id}/thumbnail`}
                    alt={photo.originalName}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{photo.originalName}</p>
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      photo.photoType === "BEFORE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
                      photo.photoType === "AFTER" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" :
                      "bg-muted"
                    }`}>
                      {photo.photoType === "BEFORE" ? dict.site.before :
                       photo.photoType === "AFTER" ? dict.site.after : dict.site.general}
                    </span>
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button type="button" variant="destructive" size="icon" className="size-7" onClick={() => handleDeletePhoto(photo.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
