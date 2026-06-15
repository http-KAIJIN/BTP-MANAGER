"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Project, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

const TYPE_OPTIONS = [
  { value: "", label: dict.labels.optional },
  { value: "APPARTEMENT", label: dict.properties.apartment },
  { value: "LOCAL_COMMERCIAL", label: dict.properties.commercialSpace },
  { value: "BUREAU", label: dict.properties.office },
  { value: "ENTREPOT", label: dict.properties.warehouse },
];
const STATUS_OPTIONS = [
  { value: "DISPONIBLE", label: dict.properties.available },
  { value: "RESERVE", label: dict.properties.reserved },
  { value: "VENDU", label: dict.properties.sold },
];

export default function NewProperty() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reference: "", type: "", surface: "", projectId: "", price: "", status: "DISPONIBLE", notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<PaginatedResponse<Project>>("/projects", { limit: "100" })
      .then((p) => setProjects(p.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/real-estate/properties", {
        reference: form.reference || undefined,
        type: form.type || undefined,
        surface: form.surface ? Number(form.surface) : undefined,
        price: form.price ? Number(form.price) : undefined,
        projectId: form.projectId,
        status: form.status || undefined,
        notes: form.notes || undefined,
      });
      router.push("/properties");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.properties.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.properties.detail} columns={1}>
          <TextField label={dict.properties.reference} value={form.reference} onChange={(v) => update("reference", v)} hint={dict.labels.optional} full />
          <SelectField label={dict.properties.type} value={form.type} onChange={(v) => update("type", v)} options={TYPE_OPTIONS} hint={dict.labels.optional} />
          <SelectField label={dict.properties.status} value={form.status} onChange={(v) => update("status", v)} options={STATUS_OPTIONS} hint={dict.labels.optional} />
          <TextField label={dict.properties.surface} type="number" value={form.surface} onChange={(v) => update("surface", v)} hint={dict.labels.optional} />
          <TextField label={dict.properties.price} type="number" value={form.price} onChange={(v) => update("price", v)} hint={dict.labels.optional} />
          <SelectField label={dict.properties.project} value={form.projectId} onChange={(v) => update("projectId", v)} options={projects.map((p) => ({ value: p.id, label: p.name }))} required full />
          <TextareaField label={dict.labels.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
