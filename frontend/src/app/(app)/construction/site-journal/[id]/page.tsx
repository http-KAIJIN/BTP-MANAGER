"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, Trash2, Pencil, ImagePlus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import type { SiteJournal } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export default function SiteJournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [journal, setJournal] = useState<SiteJournal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState("GENERAL");

  const fetchJournal = () => {
    setLoading(true);
    api.get<SiteJournal>(`/construction/journals/${id}`)
      .then(setJournal)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJournal(); }, [id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const token = localStorage.getItem("accessToken");
      await fetch(`${API_BASE}/construction/journals/${id}/photos/batch?type=${photoType}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      fetchJournal();
    } catch {
      alert(dict.errors.saveFailed);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/construction/photos/${photoId}`);
      fetchJournal();
    } catch {
      alert(dict.errors.deleteFailed);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!journal) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href={`/construction/site-journal?projectId=${journal.projectId}`} label={dict.site.journal} />
      <PageHeader
        title={formatDate(journal.date)}
        subtitle={`${journal.progress}% · ${journal.weather || "-"}`}
        actions={
          <Button variant="outline" onClick={() => router.push(`/construction/site-journal/${id}/edit`)}>
            <Pencil className="size-4" />{dict.actions.edit}
          </Button>
        }
      />

      <DetailCard title={dict.site.workPerformed}>
        <InfoItem label={dict.site.summary} value={journal.summary || "-"} full />
        <InfoItem label={dict.site.workPerformed} value={journal.workPerformed || "-"} full />
        <InfoItem label={dict.site.problems} value={journal.problems || "-"} full />
        <InfoItem label={dict.site.decisions} value={journal.decisions || "-"} full />
        <InfoItem label={dict.site.nextActions} value={journal.nextActions || "-"} full />
        <InfoItem label={dict.site.notes} value={journal.notes || "-"} full />
      </DetailCard>

      {/* Photos */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">{dict.site.photos} ({journal.photos.length})</h2>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-lg border bg-background px-2 text-xs"
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value)}
              >
                <option value="GENERAL">{dict.site.general}</option>
                <option value="BEFORE">{dict.site.before}</option>
                <option value="AFTER">{dict.site.after}</option>
              </select>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                  <span><ImagePlus className="size-4" />{dict.site.addPhoto}</span>
                </Button>
                <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>
          {journal.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict.site.noPhotos}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {journal.photos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={`${API_BASE}/construction/photos/${photo.id}/thumbnail`}
                    alt={photo.originalName}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-start justify-end gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur ${
                      photo.photoType === "BEFORE" ? "bg-amber-500/80 text-white" :
                      photo.photoType === "AFTER" ? "bg-emerald-500/80 text-white" :
                      "bg-background/80"
                    }`}>{photo.photoType === "BEFORE" ? dict.site.before : photo.photoType === "AFTER" ? dict.site.after : dict.site.general}</span>
                    <Button type="button" variant="destructive" size="icon" className="size-7" onClick={() => handleDeletePhoto(photo.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      {journal.attendances && journal.attendances.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-base font-bold">{dict.site.attendance} ({journal.attendances.length})</h2>
            <div className="space-y-2">
              {journal.attendances.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-muted p-3">
                  <div>
                    <p className="text-sm font-medium">{a.intervenant.name}</p>
                    <p className="text-xs text-muted-foreground">{a.intervenant.trade || ""}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={a.isPresent ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-destructive font-medium"}>
                      {a.isPresent ? dict.site.present : dict.site.absent}
                    </span>
                    {a.hoursWorked && <span className="text-muted-foreground">{Number(a.hoursWorked)}h</span>}
                    {a.dailyCost && <span className="font-medium">{Number(a.dailyCost).toLocaleString("fr-FR")} {dict.financial.MAD}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
