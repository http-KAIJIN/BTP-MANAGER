"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Company, Project } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    name: "", description: "", address: "", city: "", startDate: "", expectedEndDate: "",
    projectType: "", ownershipType: "internal_company", ownerCompanyId: "",
    externalClientName: "", externalClientPhone: "", externalClientCompany: "", executingCompanyId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ data: Company[] }>("/companies", { limit: "100" }),
      api.get<Project>(`/projects/${id}`),
    ])
      .then(([compRes, project]) => {
        setCompanies(compRes.data || []);
        setForm({
          name: project.name, description: project.description || "", address: project.address || "",
          city: project.city, startDate: project.startDate ? project.startDate.slice(0, 10) : "",
          expectedEndDate: project.expectedEndDate ? project.expectedEndDate.slice(0, 10) : "",
          projectType: project.projectType || "", ownershipType: project.ownershipType,
          ownerCompanyId: project.ownerCompanyId || "", externalClientName: project.externalClientName || "",
          externalClientPhone: project.externalClientPhone || "", externalClientCompany: project.externalClientCompany || "",
          executingCompanyId: project.executingCompanyId,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !form.startDate || !form.executingCompanyId) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name, description: form.description || undefined, address: form.address || undefined,
        city: form.city, startDate: form.startDate, expectedEndDate: form.expectedEndDate || undefined,
        projectType: form.projectType || undefined, ownershipType: form.ownershipType, executingCompanyId: form.executingCompanyId,
      };
      if (form.ownershipType === "internal_company") {
        body.ownerCompanyId = form.ownerCompanyId || undefined;
      } else {
        body.externalClientName = form.externalClientName || undefined;
        body.externalClientPhone = form.externalClientPhone || undefined;
        body.externalClientCompany = form.externalClientCompany || undefined;
      }
      await api.patch(`/projects/${id}`, body);
      router.push("/projects");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !form.name) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));
  const ownershipOptions = [
    { value: "internal_company", label: dict.projects.ownerCompany },
    { value: "external_client", label: dict.projects.externalClient },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.projects.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <TextField label={dict.projects.name} value={form.name} onChange={(v) => update("name", v)} required full />
          <TextareaField label={dict.projects.description} value={form.description} onChange={(v) => update("description", v)} />
          <TextField label={dict.projects.city} value={form.city} onChange={(v) => update("city", v)} required />
          <TextField label={dict.projects.address} value={form.address} onChange={(v) => update("address", v)} />
          <TextField label={dict.projects.startDate} type="date" value={form.startDate} onChange={(v) => update("startDate", v)} required />
          <TextField label={dict.projects.expectedEndDate} type="date" value={form.expectedEndDate} onChange={(v) => update("expectedEndDate", v)} />
          <TextField label={dict.projects.projectType} value={form.projectType} onChange={(v) => update("projectType", v)} />
        </FormSection>

        <FormSection title={dict.projects.ownershipType}>
          <SelectField label={dict.projects.ownershipType} value={form.ownershipType} onChange={(v) => update("ownershipType", v)} options={ownershipOptions} />
          {form.ownershipType === "internal_company" ? (
            <SelectField label={dict.projects.ownerCompany} value={form.ownerCompanyId} onChange={(v) => update("ownerCompanyId", v)} options={companyOptions} />
          ) : (
            <>
              <TextField label={dict.labels.name} value={form.externalClientName} onChange={(v) => update("externalClientName", v)} />
              <TextField label={dict.labels.phone} value={form.externalClientPhone} onChange={(v) => update("externalClientPhone", v)} />
              <TextField label={dict.companies.title} value={form.externalClientCompany} onChange={(v) => update("externalClientCompany", v)} />
            </>
          )}
          <SelectField label={dict.projects.executingCompany} value={form.executingCompanyId} onChange={(v) => update("executingCompanyId", v)} options={companyOptions} required full />
        </FormSection>

        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.update} />
      </form>
    </div>
  );
}
