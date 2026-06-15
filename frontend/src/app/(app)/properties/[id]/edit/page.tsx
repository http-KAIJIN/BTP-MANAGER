"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Property } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

const TYPE_OPTIONS = [
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

export default function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ reference: "", type: "APPARTEMENT", surface: "", price: "", status: "DISPONIBLE", notes: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Property>(`/real-estate/properties/${id}`)
      .then((p) => setForm({ reference: p.reference, type: p.type, surface: String(p.surface), price: String(p.price), status: p.status, notes: p.notes || "" }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.reference.trim() || !form.surface || !form.price) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/real-estate/properties/${id}`, { ...form, surface: Number(form.surface), price: Number(form.price) });
      router.push(`/properties/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !form.reference) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.properties.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.properties.detail}>
          <TextField label={dict.properties.reference} value={form.reference} onChange={(v) => update("reference", v)} required full />
          <SelectField label={dict.properties.type} value={form.type} onChange={(v) => update("type", v)} options={TYPE_OPTIONS} />
          <SelectField label={dict.properties.status} value={form.status} onChange={(v) => update("status", v)} options={STATUS_OPTIONS} />
          <TextField label={dict.properties.surface} type="number" value={form.surface} onChange={(v) => update("surface", v)} required />
          <TextField label={dict.properties.price} type="number" value={form.price} onChange={(v) => update("price", v)} required />
          <TextareaField label={dict.labels.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.update} />
      </form>
    </div>
  );
}
