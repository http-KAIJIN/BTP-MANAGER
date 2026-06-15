"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Intervenant } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function EditIntervenantPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({ name: "", phone: "", trade: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Intervenant>(`/intervenants/${id}`)
      .then((i) => setForm({ name: i.name, phone: i.phone || "", trade: i.trade || "", notes: i.notes || "" }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/intervenants/${id}`, {
        name: form.name,
        phone: form.phone || undefined,
        trade: form.trade || undefined,
        notes: form.notes || undefined,
      });
      router.push("/intervenants");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !form.name) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.intervenants.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo} columns={1}>
          <TextField label={dict.intervenants.name} value={form.name} onChange={(v) => update("name", v)} required full />
          <TextField label={dict.intervenants.trade} value={form.trade} onChange={(v) => update("trade", v)} hint={dict.labels.optional} />
          <TextField label={dict.intervenants.phone} value={form.phone} onChange={(v) => update("phone", v)} hint={dict.labels.optional} />
          <TextareaField label={dict.intervenants.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.save} />
      </form>
    </div>
  );
}
