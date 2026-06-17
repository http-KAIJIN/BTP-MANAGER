"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { MaterialCatalog, Project, PurchaseOrder, Supplier } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { ErrorState } from "@/components/ui-kit/error-state";
import { FormActions, SelectField, TextareaField, TextField } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LineItem { key: string; description: string; quantity: string; unitPrice: string; materialId: string; }
const newItem = (): LineItem => ({ key: Math.random().toString(36).slice(2, 9), description: "", quantity: "1", unitPrice: "0", materialId: "" });

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const editId = params?.id as string | undefined;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<MaterialCatalog[]>([]);
  const [form, setForm] = useState({ supplierId: "", projectId: "", orderDate: new Date().toISOString().slice(0, 10), expectedDate: "", title: "", notes: "", taxRate: "0" });
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ data: Supplier[] }>("/suppliers", { limit: "500" }),
      api.get<{ data: Project[] }>("/projects", { limit: "500" }),
      api.get<{ data: MaterialCatalog[] }>("/stock/materials", { limit: "500" }),
      editId ? api.get<PurchaseOrder>(`/purchase-orders/${editId}`) : Promise.resolve(null),
    ]).then(([sr, pr, mr, existing]) => {
      setSuppliers(sr.data); setProjects(pr.data); setMaterials(mr.data);
      if (existing) {
        setForm({
          supplierId: existing.supplierId,
          projectId: existing.projectId || "",
          orderDate: existing.orderDate.slice(0, 10),
          expectedDate: existing.expectedDate ? existing.expectedDate.slice(0, 10) : "",
          title: existing.title || "",
          notes: existing.notes || "",
          taxRate: String(Number(existing.taxRate)),
        });
        setItems(existing.items.map((item) => ({
          key: item.id,
          description: item.description,
          quantity: String(Number(item.quantity)),
          unitPrice: String(Number(item.unitPrice)),
          materialId: item.materialId || "",
        })));
      }
    }).catch(() => {});
  }, [editId]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const updateItem = (key: string, field: string, value: string) => setItems((arr) => arr.map((it) => it.key === key ? { ...it, [field]: value } : it));
  const removeItem = (key: string) => setItems((arr) => arr.filter((it) => it.key !== key));
  const subtotalHT = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const taxRate = Number(form.taxRate) || 0;
  const taxAmount = subtotalHT * (taxRate / 100);
  const totalTTC = subtotalHT + taxAmount;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const filtered = items.filter((it) => it.description.trim());
    if (!form.supplierId || filtered.length === 0) { setError(dict.errors.required); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        supplierId: form.supplierId,
        projectId: form.projectId || undefined,
        orderDate: form.orderDate,
        expectedDate: form.expectedDate || undefined,
        title: form.title || undefined,
        notes: form.notes || undefined,
        taxRate,
        items: filtered.map((it) => ({ description: it.description, quantity: Number(it.quantity) || 1, unitPrice: Number(it.unitPrice) || 0, materialId: it.materialId || undefined })),
      };
      const po = editId
        ? await api.patch<{ id: string }>(`/purchase-orders/${editId}`, payload)
        : await api.post<{ id: string }>("/purchase-orders", payload);
      router.push(`/purchase-orders/${po.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={editId ? dict.purchaseOrders.edit : dict.purchaseOrders.new} />
      <form onSubmit={submit} className="space-y-6">
        <FormSection title={dict.labels.generalInfo}>
          <SelectField label={dict.purchaseOrders.supplier} value={form.supplierId} onChange={(v) => update("supplierId", v)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="--" required />
          <SelectField label={dict.purchaseOrders.project} value={form.projectId} onChange={(v) => update("projectId", v)} options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="--" />
          <TextField label={dict.purchaseOrders.orderDate} value={form.orderDate} onChange={(v) => update("orderDate", v)} type="date" />
          <TextField label={dict.purchaseOrders.expectedDate} value={form.expectedDate} onChange={(v) => update("expectedDate", v)} type="date" />
          <TextField label={dict.purchaseOrders.orderTitle} value={form.title} onChange={(v) => update("title", v)} />
          <TextareaField label={dict.purchaseOrders.notes} value={form.notes} onChange={(v) => update("notes", v)} />
        </FormSection>
        <FormSection title={dict.purchaseOrders.items}>
          {items.map((it, i) => (
            <Card key={it.key}><CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2"><span className="text-sm font-bold text-muted-foreground">{i + 1}</span>{items.length > 1 && <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeItem(it.key)}><Trash2 className="size-4" /></Button>}</div>
              <SelectField label={dict.stock.material} value={it.materialId} onChange={(v) => { const mat = materials.find((m) => m.id === v); updateItem(it.key, "materialId", v); if (mat && !it.description) updateItem(it.key, "description", mat.name); if (mat?.unitPrice != null) updateItem(it.key, "unitPrice", String(Number(mat.unitPrice))); }} options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` }))} placeholder="--" />
              <TextField label={dict.purchaseOrders.description} value={it.description} onChange={(v) => updateItem(it.key, "description", v)} full />
              <div className="grid grid-cols-2 gap-3"><TextField label={dict.purchaseOrders.quantity} value={it.quantity} onChange={(v) => updateItem(it.key, "quantity", v)} type="number" /><TextField label={dict.purchaseOrders.unitPrice} value={it.unitPrice} onChange={(v) => updateItem(it.key, "unitPrice", v)} type="number" /></div>
              <div className="text-sm font-semibold">{dict.purchaseOrders.totalHT}: {formatMAD((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}</div>
            </CardContent></Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((arr) => [...arr, newItem()])}><Plus className="size-4" />{dict.purchaseOrders.addItem}</Button>
        </FormSection>
        <FormSection title={dict.labels.summary}>
          <div className="space-y-2"><div className="flex justify-between text-sm"><span>{dict.purchaseOrders.totalHT}</span><span>{formatMAD(subtotalHT)}</span></div><div className="flex justify-between text-sm"><span>{dict.purchaseOrders.taxRate}</span><input type="number" value={form.taxRate} onChange={(e) => update("taxRate", e.target.value)} className="w-20 rounded-md border bg-transparent px-2 py-1 text-end" /></div><div className="flex justify-between text-sm"><span>{dict.purchaseOrders.taxAmount}</span><span>{formatMAD(taxAmount)}</span></div><div className="flex justify-between border-t pt-2 text-base font-bold"><span>{dict.purchaseOrders.totalTTC}</span><span>{formatMAD(totalTTC)}</span></div></div>
        </FormSection>
        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={editId ? dict.actions.save : dict.actions.create} />
      </form>
    </div>
  );
}
