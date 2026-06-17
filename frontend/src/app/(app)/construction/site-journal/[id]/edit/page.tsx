"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { SiteJournal } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";
import LoadingSpinner from "@/components/loading-spinner";

export default function EditSiteJournalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: "",
    weather: "",
    progress: "0",
    summary: "",
    workPerformed: "",
    problems: "",
    decisions: "",
    nextActions: "",
    notes: "",
  });

  useEffect(() => {
    api.get<SiteJournal>(`/construction/journals/${id}`)
      .then((j) => {
        setForm({
          date: j.date?.slice(0, 10) || "",
          weather: j.weather || "",
          progress: String(j.progress || 0),
          summary: j.summary || "",
          workPerformed: j.workPerformed || "",
          problems: j.problems || "",
          decisions: j.decisions || "",
          nextActions: j.nextActions || "",
          notes: j.notes || "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/construction/journals/${id}`, {
        date: form.date || undefined,
        weather: form.weather || undefined,
        progress: Number(form.progress) || 0,
        summary: form.summary || undefined,
        workPerformed: form.workPerformed || undefined,
        problems: form.problems || undefined,
        decisions: form.decisions || undefined,
        nextActions: form.nextActions || undefined,
        notes: form.notes || undefined,
      });
      router.push(`/construction/site-journal/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.site.editJournal} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <TextField label={dict.site.date} value={form.date} onChange={(v) => update("date", v)} type="date" />
          <TextField label={dict.site.weather} value={form.weather} onChange={(v) => update("weather", v)} placeholder="Soleil, Pluie, Nuageux..." />
          <TextField label={dict.site.progress} value={form.progress} onChange={(v) => update("progress", v)} type="number" hint="0-100%" />
        </FormSection>
        <FormSection title={dict.site.summary}>
          <TextareaField label={dict.site.summary} value={form.summary} onChange={(v) => update("summary", v)} rows={3} />
          <TextareaField label={dict.site.workPerformed} value={form.workPerformed} onChange={(v) => update("workPerformed", v)} rows={3} />
          <TextareaField label={dict.site.problems} value={form.problems} onChange={(v) => update("problems", v)} rows={2} />
          <TextareaField label={dict.site.decisions} value={form.decisions} onChange={(v) => update("decisions", v)} rows={2} />
          <TextareaField label={dict.site.nextActions} value={form.nextActions} onChange={(v) => update("nextActions", v)} rows={2} />
          <TextareaField label={dict.site.notes} value={form.notes} onChange={(v) => update("notes", v)} rows={2} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.update} />
      </form>
    </div>
  );
}
