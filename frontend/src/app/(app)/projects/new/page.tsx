"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

const OWNERSHIP_OPTIONS = [
  { value: "", label: dict.labels.optional },
  { value: "internal_company", label: dict.projects.ownerCompany },
  { value: "external_client", label: dict.projects.externalClient },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", description: "", address: "", city: "", startDate: "", expectedEndDate: "",
    projectType: "", ownershipType: "", ownerCompanyId: "",
    externalClientName: "", externalClientPhone: "", externalClientCompany: "", executingCompanyId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        startDate: form.startDate || undefined,
        expectedEndDate: form.expectedEndDate || undefined,
        projectType: form.projectType || undefined,
        ownershipType: form.ownershipType || undefined,
        executingCompanyId: form.executingCompanyId || undefined,
      };
      if (form.ownershipType === "internal_company") {
        body.ownerCompanyId = form.ownerCompanyId || undefined;
      } else if (form.ownershipType === "external_client") {
        body.externalClientName = form.externalClientName || undefined;
        body.externalClientPhone = form.externalClientPhone || undefined;
        body.externalClientCompany = form.externalClientCompany || undefined;
      }
      await api.post("/projects", body);
      router.push("/projects");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.projects.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo} columns={1}>
          <TextField label={dict.projects.name} value={form.name} onChange={(v) => update("name", v)} required full />
          <TextareaField label={dict.projects.description} value={form.description} onChange={(v) => update("description", v)} />
          <TextField label={dict.projects.city} value={form.city} onChange={(v) => update("city", v)} hint={dict.labels.optional} />
          <TextField label={dict.projects.address} value={form.address} onChange={(v) => update("address", v)} />
          <TextField label={dict.projects.startDate} type="date" value={form.startDate} onChange={(v) => update("startDate", v)} hint={dict.labels.optional} />
          <TextField label={dict.projects.expectedEndDate} type="date" value={form.expectedEndDate} onChange={(v) => update("expectedEndDate", v)} hint={dict.labels.optional} />
          <TextField label={dict.projects.projectType} value={form.projectType} onChange={(v) => update("projectType", v)} hint={dict.labels.optional} />
        </FormSection>

        <FormSection title={dict.projects.ownershipType} columns={1}>
          <SelectField label={dict.projects.ownershipType} value={form.ownershipType} onChange={(v) => update("ownershipType", v)} options={OWNERSHIP_OPTIONS} full hint={dict.labels.optional} />
          {form.ownershipType === "internal_company" && (
            <SelectField label={dict.projects.ownerCompany} value={form.ownerCompanyId} onChange={(v) => update("ownerCompanyId", v)} options={[]} full hint={dict.labels.optional} />
          )}
          {form.ownershipType === "external_client" && (
            <>
              <TextField label={dict.labels.name} value={form.externalClientName} onChange={(v) => update("externalClientName", v)} hint={dict.labels.optional} />
              <TextField label={dict.labels.phone} value={form.externalClientPhone} onChange={(v) => update("externalClientPhone", v)} hint={dict.labels.optional} />
              <TextField label={dict.companies.title} value={form.externalClientCompany} onChange={(v) => update("externalClientCompany", v)} hint={dict.labels.optional} />
            </>
          )}
          <SelectField label={dict.projects.executingCompany} value={form.executingCompanyId} onChange={(v) => update("executingCompanyId", v)} options={[]} full hint={dict.labels.optional} />
        </FormSection>

        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
