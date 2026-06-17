"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Project, SiteJournalPhoto } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FilterSelect } from "@/components/ui-kit/list-controls";
import { ErrorState } from "@/components/ui-kit/error-state";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface PhotoWithJournal extends SiteJournalPhoto {
  journalDate?: string;
}

export default function SitePhotosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [photos, setPhotos] = useState<PhotoWithJournal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Project[] }>("/projects", { limit: "200" })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) { setPhotos([]); return; }
    setLoading(true);
    setError("");
    // Fetch all journals for this project with their photos
    api.get<{ data: { id: string; date: string; photos: SiteJournalPhoto[] }[] }>("/construction/journals", { projectId, limit: "200" })
      .then((r) => {
        const all: PhotoWithJournal[] = [];
        for (const j of r.data) {
          for (const p of j.photos) {
            all.push({ ...p, journalDate: j.date });
          }
        }
        setPhotos(all);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/construction/photos/${photoId}`);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch {
      alert(dict.errors.deleteFailed);
    }
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.site.sitePhotos} />

      <FilterSelect
        options={[{ value: "", label: dict.labels.all }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
        value={projectId}
        onValueChange={setProjectId}
      />

      {error && <ErrorState message={error} />}
      {loading && <LoadingSpinner />}

      {photos.length === 0 && !loading && !error && projectId && (
        <p className="text-center text-sm text-muted-foreground py-12">{dict.site.noPhotos}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative overflow-hidden rounded-xl border bg-muted">
            <img
              src={`${API_BASE}/construction/photos/${photo.id}/file`}
              alt={photo.originalName}
              className="h-48 w-full object-cover"
              loading="lazy"
            />
            <div className="p-2">
              <p className="text-xs font-medium truncate">{photo.originalName}</p>
              {photo.journalDate && <p className="text-xs text-muted-foreground">{photo.journalDate}</p>}
              <span className="inline-block mt-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{photo.photoType || dict.site.general}</span>
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
  );
}
