"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Expense, Project, ExpenseCategory, Supplier, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";

const MODE_OPTIONS = [
  { value: "cash", label: dict.expenses.cash },
  { value: "cheque", label: dict.expenses.cheque },
  { value: "bank_transfer", label: dict.expenses.bankTransfer },
];

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "", categoryId: "", supplierId: "", description: "",
    amount: "", expenseDate: "", paymentMode: "cash", notes: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<Expense>(`/expenses/${params.id}`),
      api.get<PaginatedResponse<Project>>("/projects", { limit: "100" }),
      api.get<PaginatedResponse<ExpenseCategory>>("/expense-categories", { limit: "100" }),
      api.get<PaginatedResponse<Supplier>>("/suppliers", { limit: "100" }),
    ])
      .then(([expense, p, c, s]) => {
        setProjects(p.data); setCategories(c.data); setSuppliers(s.data);
        setForm({
          projectId: expense.projectId,
          categoryId: expense.categoryId,
          supplierId: expense.supplierId || "",
          description: expense.description,
          amount: String(expense.amount),
          expenseDate: expense.expenseDate.split("T")[0],
          paymentMode: expense.paymentMode,
          notes: expense.notes || "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.categoryId || !form.description || !form.amount || !form.expenseDate) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/expenses/${params.id}`, {
        projectId: form.projectId,
        categoryId: form.categoryId,
        supplierId: form.supplierId || null,
        description: form.description,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        paymentMode: form.paymentMode,
        notes: form.notes || undefined,
      });
      router.push("/expenses");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  const projectOptions = projects.map((p) => ({ value: p.id, label: `${p.name} - ${p.city}` }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.expenses.edit} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.expenses.detail}>
          <SelectField label={dict.expenses.project} value={form.projectId} onChange={(v) => update("projectId", v)} options={projectOptions} required />
          <SelectField label={dict.expenses.category} value={form.categoryId} onChange={(v) => update("categoryId", v)} options={categories.map((c) => ({ value: c.id, label: c.name }))} required />
          <SelectField label={`${dict.expenses.supplier} (${dict.labels.optional})`} value={form.supplierId} onChange={(v) => update("supplierId", v)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} full />
          <TextareaField label={dict.expenses.description} value={form.description} onChange={(v) => update("description", v)} rows={2} required />
          <TextField label={dict.expenses.amount} type="number" value={form.amount} onChange={(v) => update("amount", v)} required />
          <TextField label={dict.expenses.expenseDate} type="date" value={form.expenseDate} onChange={(v) => update("expenseDate", v)} required />
          <SelectField label={dict.financial.paymentMode} value={form.paymentMode} onChange={(v) => update("paymentMode", v)} options={MODE_OPTIONS} required />
          <TextareaField label={dict.expenses.notes} value={form.notes} onChange={(v) => update("notes", v)} rows={2} />
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.save} />
      </form>
    </div>
  );
}
