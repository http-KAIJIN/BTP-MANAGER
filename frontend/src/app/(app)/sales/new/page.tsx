"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Client, Property, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function NewSale() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ clientId: "", propertyId: "", salePrice: "", downPayment: "", saleDate: new Date().toISOString().split("T")[0], notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Client>>("/clients", { limit: "100" }),
      api.get<PaginatedResponse<Property>>("/real-estate/properties", { limit: "100" }),
    ])
      .then(([c, p]) => { setClients(c.data); setProperties(p.data); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.propertyId || !form.salePrice) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/real-estate/sales", { ...form, salePrice: Number(form.salePrice), downPayment: form.downPayment ? Number(form.downPayment) : undefined });
      router.push("/sales");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.sales.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.sales.detail}>
          <SelectField label={dict.sales.client} value={form.clientId} onChange={(v) => update("clientId", v)} options={clients.map((c) => ({ value: c.id, label: c.name }))} required />
          <SelectField label={dict.sales.property} value={form.propertyId} onChange={(v) => update("propertyId", v)} options={properties.map((p) => ({ value: p.id, label: `${p.reference}${p.project?.name ? ` - ${p.project.name}` : ""}` }))} required />
          <TextField label={dict.sales.salePrice} type="number" value={form.salePrice} onChange={(v) => update("salePrice", v)} required />
          <TextField label={dict.sales.downPayment} type="number" value={form.downPayment} onChange={(v) => update("downPayment", v)} />
          <TextField label={dict.sales.saleDate} type="date" value={form.saleDate} onChange={(v) => update("saleDate", v)} />
          <TextareaField label={dict.labels.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
