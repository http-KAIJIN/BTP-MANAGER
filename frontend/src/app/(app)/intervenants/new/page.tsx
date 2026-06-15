"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function NewIntervenantPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", trade: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/intervenants", {
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.intervenants.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo} columns={1}>
          <TextField label={dict.intervenants.name} value={form.name} onChange={(v) => update("name", v)} required full error={error && !form.name.trim() ? dict.errors.required : undefined} />
          <TextField label={dict.intervenants.trade} value={form.trade} onChange={(v) => update("trade", v)} hint={dict.labels.optional} />
          <TextField label={dict.intervenants.phone} value={form.phone} onChange={(v) => update("phone", v)} hint={dict.labels.optional} />
          <TextareaField label={dict.intervenants.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
