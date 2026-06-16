"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Commitment, Project, Supplier, Intervenant, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function EditCommitmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "", beneficiaryType: "supplier", supplierId: "", intervenantId: "",
    description: "", agreedAmount: "", commitmentDate: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<Commitment>(`/commitments/${params.id}`),
      api.get<PaginatedResponse<Project>>("/projects", { limit: "100" }),
      api.get<PaginatedResponse<Supplier>>("/suppliers", { limit: "100" }),
      api.get<PaginatedResponse<Intervenant>>("/intervenants", { limit: "100" }),
    ])
      .then(([commitment, p, s, i]) => {
        setProjects(p.data); setSuppliers(s.data); setIntervenants(i.data);
        setForm({
          projectId: commitment.projectId,
          beneficiaryType: commitment.supplierId ? "supplier" : "intervenant",
          supplierId: commitment.supplierId || "",
          intervenantId: commitment.intervenantId || "",
          description: commitment.description,
          agreedAmount: String(commitment.agreedAmount),
          commitmentDate: commitment.commitmentDate.split("T")[0],
          notes: commitment.notes || "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.description || !form.agreedAmount || !form.commitmentDate) { setError(dict.errors.validation); return; }
    if (form.beneficiaryType === "supplier" && !form.supplierId) { setError(dict.errors.validation); return; }
    if (form.beneficiaryType === "intervenant" && !form.intervenantId) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/commitments/${params.id}`, {
        projectId: form.projectId,
        beneficiaryType: form.beneficiaryType,
        supplierId: form.beneficiaryType === "supplier" ? form.supplierId : null,
        intervenantId: form.beneficiaryType === "intervenant" ? form.intervenantId : null,
        description: form.description,
        agreedAmount: Number(form.agreedAmount),
        commitmentDate: form.commitmentDate,
        notes: form.notes || undefined,
      });
      router.push("/commitments");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  const projectOptions = projects.map((p) => ({ value: p.id, label: `${p.name} - ${p.city ?? ""}` }));
  const benTypeOptions = [
    { value: "supplier", label: dict.commitments.supplier },
    { value: "intervenant", label: dict.commitments.intervenant },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.commitments.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.commitments.detail}>
          <SelectField label={dict.commitments.project} value={form.projectId} onChange={(v) => update("projectId", v)} options={projectOptions} required full />
          <SelectField label={dict.commitments.beneficiaryType} value={form.beneficiaryType} onChange={(v) => update("beneficiaryType", v)} options={benTypeOptions} required />
          {form.beneficiaryType === "supplier" ? (
            <SelectField label={dict.commitments.supplier} value={form.supplierId} onChange={(v) => update("supplierId", v)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} required />
          ) : (
            <SelectField label={dict.commitments.intervenant} value={form.intervenantId} onChange={(v) => update("intervenantId", v)} options={intervenants.map((i) => ({ value: i.id, label: `${i.name} - ${i.trade ?? ""}` }))} required />
          )}
          <TextareaField label={dict.commitments.description} value={form.description} onChange={(v) => update("description", v)} rows={2} required />
          <TextField label={dict.financial.agreedAmount} type="number" value={form.agreedAmount} onChange={(v) => update("agreedAmount", v)} required />
          <TextField label={dict.commitments.commitmentDate} type="date" value={form.commitmentDate} onChange={(v) => update("commitmentDate", v)} required />
          <TextareaField label={dict.commitments.notes} value={form.notes} onChange={(v) => update("notes", v)} rows={2} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.save} />
      </form>
    </div>
  );
}
