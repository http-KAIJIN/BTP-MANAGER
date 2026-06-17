"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Project } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, SelectField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function NewSiteJournalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    projectId: searchParams.get("projectId") || "",
    date: new Date().toISOString().slice(0, 10),
    weather: "",
    progress: "0",
    summary: "",
    workPerformed: "",
    problems: "",
    decisions: "",
    nextActions: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Project[] }>("/projects", { limit: "200" })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/construction/journals", {
        projectId: form.projectId,
        date: form.date,
        weather: form.weather || undefined,
        progress: Number(form.progress) || 0,
        summary: form.summary || undefined,
        workPerformed: form.workPerformed || undefined,
        problems: form.problems || undefined,
        decisions: form.decisions || undefined,
        nextActions: form.nextActions || undefined,
        notes: form.notes || undefined,
      });
      router.push(`/construction/site-journal?projectId=${form.projectId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.site.newJournal} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <SelectField label={dict.nav.projects} value={form.projectId} onChange={(v) => update("projectId", v)} options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="--" required />
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
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
