"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", ice: "", address: "", phone: "", email: "", managerName: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/companies", form);
      router.push("/companies");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.companies.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <TextField label={dict.companies.name} value={form.name} onChange={(v) => update("name", v)} required error={error && !form.name.trim() ? dict.errors.required : undefined} />
          <TextField label={dict.companies.ICE} value={form.ice} onChange={(v) => update("ice", v)} />
          <TextField label={dict.companies.phone} value={form.phone} onChange={(v) => update("phone", v)} />
          <TextField label={dict.companies.email} type="email" value={form.email} onChange={(v) => update("email", v)} />
          <TextField label={dict.companies.managerName} value={form.managerName} onChange={(v) => update("managerName", v)} />
          <TextField label={dict.companies.address} value={form.address} onChange={(v) => update("address", v)} />
          <TextareaField label={dict.companies.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
