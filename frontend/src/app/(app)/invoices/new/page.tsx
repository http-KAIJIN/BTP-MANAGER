"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Client, Quote } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, SelectField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LineItem {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

function newItem(): LineItem {
  return { key: Math.random().toString(36).slice(2, 9), description: "", quantity: "1", unit: "unité", unitPrice: "0" };
}

const UNIT_OPTIONS = ["m²", "m³", "kg", "tonne", "ml", "unité", "forfait"].map((unit) => ({ value: unit, label: unit }));

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState<Quote[]>([]);
  const [form, setForm] = useState({ clientId: "", invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "", title: "", notes: "", taxRate: "0", fromQuoteId: "", contractReference: "", siteReference: "", projectReference: "", workPhase: "", projectManager: "", advancePayment: "", advancePercentage: "", paymentSchedule: "", paymentTerms: "", retentionGuarantee: "" });
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ data: Client[] }>("/clients", { limit: "100" }),
      api.get<{ data: Quote[] }>("/quotes", { limit: "100" }),
    ]).then(([cr, qr]) => {
      setClients(cr.data);
      setAcceptedQuotes(qr.data.filter((q) => q.status === "ACCEPTED"));
    }).catch(() => {});
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const updateItem = (key: string, field: string, value: string) =>
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, [field]: value } : it)));

  const removeItem = (key: string) => setItems((arr) => arr.filter((it) => it.key !== key));

  const loadFromQuote = (quoteId: string) => {
    const quote = acceptedQuotes.find((q) => q.id === quoteId);
    if (!quote) return;
    setForm((f) => ({
      ...f,
      fromQuoteId: quoteId,
      clientId: quote.clientId,
      title: quote.title || "",
      notes: quote.notes || "",
      taxRate: String(Number(quote.taxRate)),
      contractReference: quote.contractReference || "",
      siteReference: quote.siteReference || "",
      projectReference: quote.projectReference || "",
      workPhase: quote.workPhase || "",
      projectManager: quote.projectManager || "",
      advancePayment: quote.advancePayment ? String(Number(quote.advancePayment)) : "",
      advancePercentage: quote.advancePercentage ? String(Number(quote.advancePercentage)) : "",
      paymentSchedule: quote.paymentSchedule || "",
      paymentTerms: quote.paymentTerms || "",
      retentionGuarantee: quote.retentionGuarantee ? String(Number(quote.retentionGuarantee)) : "",
    }));
    setItems(quote.items.map((it) => ({
      key: it.id,
      description: it.description,
      quantity: String(Number(it.quantity)),
      unit: it.unit || "unité",
      unitPrice: String(Number(it.unitPrice)),
    })));
  };

  const subtotalHT = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const taxRate = Number(form.taxRate) || 0;
  const taxAmount = subtotalHT * (taxRate / 100);
  const totalTTC = subtotalHT + taxAmount;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { setError(dict.errors.required); return; }
    const filtered = items.filter((it) => it.description.trim());
    if (filtered.length === 0) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");

    try {
      if (form.fromQuoteId) {
        await api.post(`/invoices/from-quote/${form.fromQuoteId}`);
      } else {
        await api.post("/invoices", {
          clientId: form.clientId,
          invoiceDate: form.invoiceDate,
          dueDate: form.dueDate || undefined,
          title: form.title || undefined,
          notes: form.notes || undefined,
          contractReference: form.contractReference || undefined,
          siteReference: form.siteReference || undefined,
          projectReference: form.projectReference || undefined,
          workPhase: form.workPhase || undefined,
          projectManager: form.projectManager || undefined,
          advancePayment: form.advancePayment ? Number(form.advancePayment) : undefined,
          advancePercentage: form.advancePercentage ? Number(form.advancePercentage) : undefined,
          paymentSchedule: form.paymentSchedule || undefined,
          paymentTerms: form.paymentTerms || undefined,
          retentionGuarantee: form.retentionGuarantee ? Number(form.retentionGuarantee) : undefined,
          taxRate: taxRate,
          items: filtered.map((it, i) => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || "unité",
            unitPrice: Number(it.unitPrice) || 0,
            sortOrder: i,
          })),
        });
      }
      router.push("/invoices");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.invoices.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          {acceptedQuotes.length > 0 && (
            <SelectField
              label={dict.invoices.fromQuote}
              value={form.fromQuoteId}
              onChange={loadFromQuote}
              options={acceptedQuotes.map((q) => ({ value: q.id, label: `${q.quoteNumber} - ${q.client.name} (${formatMAD(Number(q.totalTTC))})` }))}
              placeholder="--"
              hint={dict.labels.optional}
            />
          )}
          <SelectField label={dict.invoices.client} value={form.clientId} onChange={(v) => update("clientId", v)} options={clients.map((c) => ({ value: c.id, label: c.name }))} placeholder="--" required />
          <TextField label={dict.invoices.date} value={form.invoiceDate} onChange={(v) => update("invoiceDate", v)} type="date" />
          <TextField label={dict.invoices.dueDate} value={form.dueDate} onChange={(v) => update("dueDate", v)} type="date" />
          <TextField label={dict.labels.title} value={form.title} onChange={(v) => update("title", v)} />
          <TextareaField label={dict.labels.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>

        <FormSection title="Références chantier">
          <TextField label="Référence contrat" value={form.contractReference} onChange={(v) => update("contractReference", v)} />
          <TextField label="Code chantier" value={form.siteReference} onChange={(v) => update("siteReference", v)} />
          <TextField label="Référence projet" value={form.projectReference} onChange={(v) => update("projectReference", v)} />
          <TextField label="Phase / Lot" value={form.workPhase} onChange={(v) => update("workPhase", v)} />
          <TextField label="Chef de projet" value={form.projectManager} onChange={(v) => update("projectManager", v)} />
        </FormSection>

        <FormSection title="Conditions de paiement">
          <TextField label="Avance MAD" value={form.advancePayment} onChange={(v) => update("advancePayment", v)} type="number" />
          <TextField label="Avance %" value={form.advancePercentage} onChange={(v) => update("advancePercentage", v)} type="number" />
          <TextField label="Retenue de garantie %" value={form.retentionGuarantee} onChange={(v) => update("retentionGuarantee", v)} type="number" />
          <TextareaField label="Échéancier" value={form.paymentSchedule} onChange={(v) => update("paymentSchedule", v)} />
          <TextareaField label="Termes de paiement" value={form.paymentTerms} onChange={(v) => update("paymentTerms", v)} />
        </FormSection>

        <FormSection title={dict.invoices.items}>
          {items.map((it, i) => (
            <Card key={it.key} className="relative">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeItem(it.key)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <TextField label={dict.invoices.description} value={it.description} onChange={(v) => updateItem(it.key, "description", v)} full />
                <div className="grid grid-cols-3 gap-3">
                  <TextField label={dict.invoices.quantity} value={it.quantity} onChange={(v) => updateItem(it.key, "quantity", v)} type="number" />
                  <SelectField label="Unité" value={it.unit} onChange={(v) => updateItem(it.key, "unit", v)} options={UNIT_OPTIONS} />
                  <TextField label={dict.invoices.unitPrice} value={it.unitPrice} onChange={(v) => updateItem(it.key, "unitPrice", v)} type="number" />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {dict.invoices.totalHT}: {formatMAD((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((arr) => [...arr, newItem()])}>
            <Plus className="size-4" />{dict.invoices.addItem}
          </Button>
        </FormSection>

        <FormSection title={dict.labels.summary}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{dict.invoices.totalHT}</span><span className="font-medium">{formatMAD(subtotalHT)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{dict.invoices.taxRate}</span>
              <div className="w-24"><div className="flex items-center gap-1"><input type="number" value={form.taxRate} onChange={(e) => update("taxRate", e.target.value)} className="w-16 rounded-md border bg-transparent px-2 py-1 text-end text-sm tabular-nums" /><span className="text-xs text-muted-foreground">%</span></div></div>
            </div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{dict.invoices.taxAmount}</span><span className="font-medium">{formatMAD(taxAmount)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>{dict.invoices.totalTTC}</span><span className="text-lg">{formatMAD(totalTTC)}</span></div>
          </div>
        </FormSection>

        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
