"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Company } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({ name: "", ice: "", address: "", phone: "", email: "", managerName: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Company>(`/companies/${id}`)
      .then((c) => setForm({ name: c.name, ice: c.ice || "", address: c.address || "", phone: c.phone || "", email: c.email || "", managerName: c.managerName || "", notes: c.notes || "" }))
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
      await api.patch(`/companies/${id}`, form);
      router.push("/companies");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !form.name) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.companies.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <TextField label={dict.companies.name} value={form.name} onChange={(v) => update("name", v)} required />
          <TextField label={dict.companies.ICE} value={form.ice} onChange={(v) => update("ice", v)} />
          <TextField label={dict.companies.phone} value={form.phone} onChange={(v) => update("phone", v)} />
          <TextField label={dict.companies.email} type="email" value={form.email} onChange={(v) => update("email", v)} />
          <TextField label={dict.companies.managerName} value={form.managerName} onChange={(v) => update("managerName", v)} />
          <TextField label={dict.companies.address} value={form.address} onChange={(v) => update("address", v)} />
          <TextareaField label={dict.companies.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.update} />
      </form>
    </div>
  );
}
