"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Sale } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function EditSale() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ salePrice: "", downPayment: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Sale>(`/real-estate/sales/${id}`)
      .then((s) => setForm({ salePrice: String(s.salePrice), downPayment: String(s.downPayment), notes: s.notes || "" }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.salePrice) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/real-estate/sales/${id}`, { salePrice: Number(form.salePrice), downPayment: Number(form.downPayment), notes: form.notes });
      router.push(`/sales/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.sales.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.sales.detail}>
          <TextField label={dict.sales.salePrice} type="number" value={form.salePrice} onChange={(v) => update("salePrice", v)} required />
          <TextField label={dict.sales.downPayment} type="number" value={form.downPayment} onChange={(v) => update("downPayment", v)} />
          <TextareaField label={dict.labels.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.update} />
      </form>
    </div>
  );
}
