"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { ExpenseCategory, PaginatedResponse, Project, Supplier } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { ErrorState } from "@/components/ui-kit/error-state";
import { SelectField, TextareaField, TextField } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AISettings { provider: string; apiKey: string | null; enabled: boolean; monthlyBudget: number; currentMonthCost: number; }
interface AIUsage { totalCost: number; totalScans: number; remainingBudget: number; enabled: boolean; monthlyBudget: number; currentMonthCost: number; }
interface OcrResult { success: boolean; data: { supplierName: string; date: string; invoiceNumber: string; amount: number; tva: number; currency: string; description: string }; suggestedCategory: { id: string; name: string } | null; suggestedSupplier: { id: string; name: string } | null; suggestedProject: { id: string; name: string } | null; logId: string; }

export default function OcrPage() {
  const [settings, setSettings] = useState({ provider: "gemini", apiKey: "", enabled: false, monthlyBudget: "5" });
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("supplierInvoice");
  const [result, setResult] = useState<OcrResult | null>(null);
  const [confirmForm, setConfirmForm] = useState({ projectId: "", categoryId: "", supplierId: "", paymentMode: "cash", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    Promise.all([
      api.get<AISettings>("/ocr/settings"),
      api.get<AIUsage>("/ocr/usage"),
      api.get<PaginatedResponse<Project>>("/projects", { limit: "500" }),
      api.get<ExpenseCategory[]>("/expense-categories"),
      api.get<PaginatedResponse<Supplier>>("/suppliers", { limit: "500" }),
    ]).then(([s, u, p, c, sup]) => {
      setSettings({ provider: s.provider, apiKey: "", enabled: s.enabled, monthlyBudget: String(Number(s.monthlyBudget || 5)) });
      setUsage(u); setProjects(p.data); setCategories(c); setSuppliers(sup.data);
    }).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const saveSettings = async () => {
    setLoading(true); setError("");
    try {
      await api.put("/ocr/settings", { provider: "gemini", apiKey: settings.apiKey || undefined, enabled: settings.enabled, monthlyBudget: Number(settings.monthlyBudget) || 5 });
      setMessage(dict.ocr.saved); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : dict.errors.saveFailed); }
    setLoading(false);
  };

  const scan = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { setError(dict.errors.required); return; }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("documentType", documentType);
    setLoading(true); setError(""); setMessage(""); setResult(null);
    try {
      const scanResult = await api.upload<OcrResult>("/ocr/scan", formData);
      setResult(scanResult);
      setConfirmForm((f) => ({ ...f, projectId: scanResult.suggestedProject?.id || f.projectId, categoryId: scanResult.suggestedCategory?.id || f.categoryId, supplierId: scanResult.suggestedSupplier?.id || f.supplierId }));
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : dict.errors.generic); }
    setLoading(false);
  };

  const confirm = async () => {
    if (!result || !confirmForm.projectId || !confirmForm.categoryId) { setError(dict.errors.required); return; }
    setLoading(true); setError("");
    try {
      await api.post("/ocr/confirm", { logId: result.logId, ...confirmForm, supplierId: confirmForm.supplierId || undefined });
      setMessage(dict.ocr.saved); setResult(null); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : dict.errors.saveFailed); }
    setLoading(false);
  };

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><PageHeader title={dict.ocr.title} subtitle={usage ? `${dict.ocr.currentUsage}: $${usage.currentMonthCost.toFixed(3)} / $${usage.monthlyBudget}` : undefined} />
    {error && <ErrorState message={error} />}{message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">{message}</div>}
    <div className="grid gap-6 lg:grid-cols-2"><FormSection title={dict.ocr.settings}><TextField label={dict.ocr.provider} value="gemini" onChange={() => {}} /><TextField label={dict.ocr.apiKey} value={settings.apiKey} onChange={(v) => setSettings((s) => ({ ...s, apiKey: v }))} type="password" /><TextField label={dict.ocr.monthlyBudget} value={settings.monthlyBudget} onChange={(v) => setSettings((s) => ({ ...s, monthlyBudget: v }))} type="number" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))} />{dict.ocr.enableOcr}</label><Button type="button" disabled={loading} onClick={saveSettings}>{dict.ocr.saveSettings}</Button></FormSection>
    <Card><CardHeader><CardTitle>{dict.ocr.currentUsage}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div>{dict.ocr.scansThisMonth}: {usage?.totalScans ?? 0}</div><div>{dict.ocr.remainingBudget}: ${usage?.remainingBudget.toFixed(3) ?? "0.000"}</div><div>{usage?.enabled ? dict.ocr.enabled : dict.ocr.disabled}</div><div className="text-muted-foreground">{dict.ocr.costPerScan}</div></CardContent></Card></div>
    <form onSubmit={scan} className="space-y-6"><FormSection title={dict.ocr.scanDocument}><SelectField label={dict.ocr.documentType} value={documentType} onChange={setDocumentType} options={[{ value: "supplierInvoice", label: dict.ocr.supplierInvoice }, { value: "expenseReceipt", label: dict.ocr.expenseReceipt }]} /><div className="space-y-2"><Label>{dict.ocr.uploadDocument}</Label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div><Button disabled={loading || !usage?.enabled}>{loading ? dict.ocr.uploading : dict.ocr.scan}</Button></FormSection></form>
    {result && <FormSection title={dict.ocr.extractedData}><div className="grid gap-3 sm:grid-cols-2 text-sm"><div><b>{dict.ocr.supplierName}</b>: {result.data.supplierName}</div><div><b>{dict.ocr.date}</b>: {result.data.date}</div><div><b>{dict.ocr.invoiceNumber}</b>: {result.data.invoiceNumber}</div><div><b>{dict.ocr.amount}</b>: {result.data.amount} {result.data.currency}</div><div><b>{dict.ocr.tva}</b>: {result.data.tva}</div><div><b>{dict.ocr.description}</b>: {result.data.description}</div></div><SelectField label={dict.expenses.project} value={confirmForm.projectId} onChange={(v) => setConfirmForm((f) => ({ ...f, projectId: v }))} options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="--" required /><SelectField label={dict.expenses.category} value={confirmForm.categoryId} onChange={(v) => setConfirmForm((f) => ({ ...f, categoryId: v }))} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="--" required /><SelectField label={dict.expenses.supplier} value={confirmForm.supplierId} onChange={(v) => setConfirmForm((f) => ({ ...f, supplierId: v }))} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="--" /><SelectField label={dict.expenses.paymentMode} value={confirmForm.paymentMode} onChange={(v) => setConfirmForm((f) => ({ ...f, paymentMode: v }))} options={[{ value: "cash", label: dict.payments.cash }, { value: "cheque", label: dict.payments.cheque }, { value: "bank_transfer", label: dict.payments.bankTransfer }]} /><TextareaField label={dict.labels.notes} value={confirmForm.notes} onChange={(v) => setConfirmForm((f) => ({ ...f, notes: v }))} /><div className="flex gap-2"><Button type="button" disabled={loading} onClick={confirm}>{dict.ocr.confirm}</Button><Button type="button" variant="outline" onClick={() => setResult(null)}>{dict.ocr.cancel}</Button></div></FormSection>}
  </div>;
}
