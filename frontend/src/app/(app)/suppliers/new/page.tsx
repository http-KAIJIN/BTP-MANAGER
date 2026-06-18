"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function NewSupplierPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", contactPerson: "", ice: "", ifTax: "", website: "", category: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/suppliers", {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        contactPerson: form.contactPerson || undefined,
        ice: form.ice || undefined,
        ifTax: form.ifTax || undefined,
        website: form.website || undefined,
        category: form.category || undefined,
        notes: form.notes || undefined,
      });
      router.push("/suppliers");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.suppliers.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <TextField label={dict.suppliers.name} value={form.name} onChange={(v) => update("name", v)} required error={error && !form.name.trim() ? dict.errors.required : undefined} />
          <TextField label={dict.suppliers.phone} value={form.phone} onChange={(v) => update("phone", v)} />
          <TextField label="Email" value={form.email} onChange={(v) => update("email", v)} />
          <TextField label="Personne de contact" value={form.contactPerson} onChange={(v) => update("contactPerson", v)} />
          <TextField label="ICE" value={form.ice} onChange={(v) => update("ice", v)} />
          <TextField label="IF" value={form.ifTax} onChange={(v) => update("ifTax", v)} />
          <TextField label="Site web" value={form.website} onChange={(v) => update("website", v)} />
          <TextField label={dict.suppliers.category} value={form.category} onChange={(v) => update("category", v)} />
          <TextareaField label="Adresse" value={form.address} onChange={(v) => update("address", v)} />
          <TextareaField label={dict.suppliers.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
