"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Client } from "@/lib/types";
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
  unitPrice: string;
}

function newItem(): LineItem {
  return { key: Math.random().toString(36).slice(2, 9), description: "", quantity: "1", unitPrice: "0" };
}

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ clientId: "", quoteDate: new Date().toISOString().slice(0, 10), validUntil: "", title: "", notes: "", taxRate: "0" });
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Client[]; meta: { total: number } }>("/clients", { limit: "500" })
      .then((r) => setClients(r.data))
      .catch(() => {});
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const updateItem = (key: string, field: string, value: string) =>
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, [field]: value } : it)));

  const removeItem = (key: string) => setItems((arr) => arr.filter((it) => it.key !== key));

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
      await api.post("/quotes", {
        clientId: form.clientId,
        quoteDate: form.quoteDate,
        validUntil: form.validUntil || undefined,
        title: form.title || undefined,
        notes: form.notes || undefined,
        taxRate: taxRate,
        items: filtered.map((it, i) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          sortOrder: i,
        })),
      });
      router.push("/quotes");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.quotes.new} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <SelectField
            label={dict.quotes.client}
            value={form.clientId}
            onChange={(v) => update("clientId", v)}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="--"
            required
          />
          <TextField label={dict.quotes.date} value={form.quoteDate} onChange={(v) => update("quoteDate", v)} type="date" />
          <TextField label={dict.quotes.validUntil} value={form.validUntil} onChange={(v) => update("validUntil", v)} type="date" />
          <TextField label={dict.labels.title} value={form.title} onChange={(v) => update("title", v)} />
          <TextareaField label={dict.labels.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>

        <FormSection title={dict.quotes.items}>
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
                <TextField label={dict.quotes.description} value={it.description} onChange={(v) => updateItem(it.key, "description", v)} full />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label={dict.quotes.quantity} value={it.quantity} onChange={(v) => updateItem(it.key, "quantity", v)} type="number" />
                  <TextField label={dict.quotes.unitPrice} value={it.unitPrice} onChange={(v) => updateItem(it.key, "unitPrice", v)} type="number" />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {dict.quotes.totalHT}: {formatMAD((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((arr) => [...arr, newItem()])}>
            <Plus className="size-4" />{dict.quotes.addItem}
          </Button>
        </FormSection>

        <FormSection title={dict.labels.summary}>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{dict.quotes.totalHT}</span>
              <span className="font-medium">{formatMAD(subtotalHT)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{dict.quotes.taxRate}</span>
              <div className="w-24">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={form.taxRate}
                    onChange={(e) => update("taxRate", e.target.value)}
                    className="w-16 rounded-md border bg-transparent px-2 py-1 text-end text-sm tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{dict.quotes.taxAmount}</span>
              <span className="font-medium">{formatMAD(taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-base font-bold">
              <span>{dict.quotes.totalTTC}</span>
              <span className="text-lg">{formatMAD(totalTTC)}</span>
            </div>
          </div>
        </FormSection>

        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
