"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Payment, Project, Commitment, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

const MODE_OPTIONS = [
  { value: "cash", label: dict.payments.cash },
  { value: "cheque", label: dict.payments.cheque },
  { value: "bank_transfer", label: dict.payments.bankTransfer },
];

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "", commitmentId: "", amount: "", paymentDate: "",
    paymentMode: "cash", chequeNumber: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<Payment>(`/payments/${params.id}`),
      api.get<PaginatedResponse<Project>>("/projects", { limit: "100" }),
    ])
      .then(([payment, p]) => {
        setProjects(p.data);
        setForm({
          projectId: payment.projectId,
          commitmentId: payment.commitmentId,
          amount: String(payment.amount),
          paymentDate: payment.paymentDate.split("T")[0],
          paymentMode: payment.paymentMode,
          chequeNumber: payment.chequeNumber || "",
          notes: payment.notes || "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!form.projectId) { setCommitments([]); return; }
    api.get<PaginatedResponse<Commitment>>("/commitments", { projectId: form.projectId, limit: "100" })
      .then((c) => setCommitments(c.data))
      .catch(() => {});
  }, [form.projectId]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.commitmentId || !form.amount || !form.paymentDate) { setError(dict.errors.validation); return; }
    if (form.paymentMode === "cheque" && !form.chequeNumber) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/payments/${params.id}`, {
        projectId: form.projectId,
        commitmentId: form.commitmentId,
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        chequeNumber: form.paymentMode === "cheque" ? form.chequeNumber : null,
        notes: form.notes || undefined,
      });
      router.push("/payments");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  const projectOptions = projects.map((p) => ({ value: p.id, label: `${p.name} - ${p.city ?? ""}` }));
  const commitmentOptions = commitments.map((c) => ({ value: c.id, label: `${c.description.substring(0, 60)} - ${formatMAD(c.agreedAmount)}` }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.payments.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.payments.detail}>
          <SelectField label={dict.payments.project} value={form.projectId} onChange={(v) => { update("projectId", v); update("commitmentId", ""); }} options={projectOptions} required full />
          <SelectField label={dict.payments.commitment} value={form.commitmentId} onChange={(v) => update("commitmentId", v)} options={commitmentOptions} required full hint={!form.projectId ? dict.labels.noData : undefined} />
          <TextField label={dict.payments.amount} type="number" value={form.amount} onChange={(v) => update("amount", v)} required />
          <TextField label={dict.payments.paymentDate} type="date" value={form.paymentDate} onChange={(v) => update("paymentDate", v)} required />
          <SelectField label={dict.financial.paymentMode} value={form.paymentMode} onChange={(v) => update("paymentMode", v)} options={MODE_OPTIONS} required />
          {form.paymentMode === "cheque" && (
            <TextField label={dict.financial.chequeNumber} value={form.chequeNumber} onChange={(v) => update("chequeNumber", v)} required />
          )}
          <TextareaField label={dict.payments.notes} value={form.notes} onChange={(v) => update("notes", v)} rows={2} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.save} />
      </form>
    </div>
  );
}
