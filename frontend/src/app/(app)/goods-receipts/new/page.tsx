"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { PaginatedResponse, PurchaseOrder } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { ErrorState } from "@/components/ui-kit/error-state";
import { FormActions, SelectField, TextareaField, TextField } from "@/components/ui-kit/form-fields";
import { Card, CardContent } from "@/components/ui/card";

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({ orderId: "", receiptDate: new Date().toISOString().slice(0, 10), supplierRef: "", notes: "" });
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<PaginatedResponse<PurchaseOrder>>("/purchase-orders", { status: "APPROVED", limit: "500" })
      .then((r) => setOrders(r.data)).catch(() => {});
  }, []);

  const loadOrder = async (orderId: string) => {
    setForm((f) => ({ ...f, orderId }));
    setError("");
    if (!orderId) { setSelected(null); return; }
    const po = await api.get<PurchaseOrder>(`/purchase-orders/${orderId}`);
    setSelected(po);
    setQuantities(Object.fromEntries(po.items.map((item) => [item.id, String(Math.max(0, Number(item.quantity) - Number(item.receivedQty)))])));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) { setError(dict.goodsReceipts.selectPO); return; }
    const items = [];
    for (const item of selected.items) {
      const remaining = Number(item.quantity) - Number(item.receivedQty);
      const qty = Number(quantities[item.id]) || 0;
      if (qty > remaining) {
        setError(`${item.description}: ${dict.goodsReceipts.qtyReceived} > ${remaining}`);
        return;
      }
      if (qty > 0) items.push({ orderItemId: item.id, qtyReceived: qty });
    }
    if (items.length === 0) { setError(dict.errors.required); return; }
    setSaving(true); setError("");
    try {
      const receipt = await api.post<{ id: string }>("/goods-receipts", { orderId: selected.id, receiptDate: form.receiptDate, supplierRef: form.supplierRef || undefined, notes: form.notes || undefined, items });
      router.push(`/goods-receipts/${receipt.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.goodsReceipts.new} />
      <form onSubmit={submit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <SelectField label={dict.goodsReceipts.order} value={form.orderId} onChange={loadOrder} options={orders.map((o) => ({ value: o.id, label: `${o.orderNumber} - ${o.supplier.name}` }))} placeholder="--" required />
          <TextField label={dict.goodsReceipts.receiptDate} value={form.receiptDate} onChange={(v) => setForm((f) => ({ ...f, receiptDate: v }))} type="date" />
          <TextField label={dict.goodsReceipts.supplierRef} value={form.supplierRef} onChange={(v) => setForm((f) => ({ ...f, supplierRef: v }))} />
          <TextareaField label={dict.goodsReceipts.notes} value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
        </FormSection>
        {selected && <FormSection title={dict.goodsReceipts.items}>{selected.items.map((item) => { const remaining = Math.max(0, Number(item.quantity) - Number(item.receivedQty)); return <Card key={item.id}><CardContent className="space-y-2 p-4"><div className="font-medium">{item.description}</div><div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground"><span>{dict.goodsReceipts.qtyOrdered}: {Number(item.quantity)}</span><span>{dict.goodsReceipts.qtyReceived}: {Number(item.receivedQty)}</span></div><TextField label={`${dict.goodsReceipts.qtyReceived} (max ${remaining})`} value={quantities[item.id] || "0"} onChange={(v) => setQuantities((q) => ({ ...q, [item.id]: v }))} type="number" /></CardContent></Card>; })}</FormSection>}
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}
