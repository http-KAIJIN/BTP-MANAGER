"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import type { SiteJournal, SiteJournalPhoto } from "@/lib/types";
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

  const fetchJournal = () => {
    setLoading(true);
    api.get<SiteJournal>(`/construction/journals/${id}`)
      .then(setJournal)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJournal(); }, [id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("accessToken");
      await fetch(`${API_BASE}/construction/journals/${id}/photos`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      fetchJournal();
    } catch {
      alert(dict.errors.saveFailed);
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/construction/photos/${photoId}`);
      fetchJournal();
    } catch {
      alert(dict.errors.deleteFailed);
    }
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!journal) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href={`/construction/site-journal?projectId=${journal.projectId}`} label={dict.site.journal} />
      <PageHeader title={formatDate(journal.date)} subtitle={`${journal.progress}% · ${journal.weather || "-"}`} />

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
            <h2 className="text-base font-bold">{dict.site.photos}</h2>
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span><Camera className="size-4" />{dict.site.addPhoto}</span>
              </Button>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
          {journal.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict.site.noPhotos}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {journal.photos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={`${API_BASE}/construction/photos/${photo.id}/file`}
                    alt={photo.originalName}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-start justify-end gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur">{photo.photoType}</span>
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
            <h2 className="text-base font-bold">{dict.site.attendance}</h2>
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
