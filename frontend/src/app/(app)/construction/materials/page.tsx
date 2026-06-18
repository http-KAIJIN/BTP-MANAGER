"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Calculator, Layers, Package, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { MaterialCatalog, MaterialCategory, PaginatedResponse } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { ErrorState } from "@/components/ui-kit/error-state";
import { FormSection } from "@/components/ui-kit/form-section";
import { FormActions, SelectField, TextField } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXAMPLES = ["Ciment CPJ35", "Ciment CPJ45", "Sable", "Gravier", "Fer 8", "Fer 10", "Fer 12", "Brique", "Hourdis", "Béton prêt"];

const initialForm = {
  name: "",
  categoryId: "",
  unit: "unité",
  defaultSupplier: "",
  purchasePriceHT: "",
  tvaRate: "20",
  minQty: "",
  currentQty: "",
};

function numberValue(value: string | number | null | undefined) {
  return Number(value || 0);
}

function ttcFromMaterial(material: MaterialCatalog) {
  const ht = numberValue(material.purchasePriceHT ?? material.unitPrice);
  const tva = numberValue(material.tvaRate ?? 20);
  return ht + ht * (tva / 100);
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialCatalog[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const quantity = numberValue(form.currentQty || 1);
  const priceHT = numberValue(form.purchasePriceHT);
  const tvaRate = numberValue(form.tvaRate);
  const totalHT = quantity * priceHT;
  const tvaAmount = totalHT * (tvaRate / 100);
  const totalTTC = totalHT + tvaAmount;

  const fetchData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<PaginatedResponse<MaterialCatalog>>("/stock/materials", { limit: "100", sortBy: "name", sortOrder: "asc" }),
      api.get<MaterialCategory[]>("/stock/categories"),
    ])
      .then(([m, c]) => { setMaterials(m.data); setCategories(c); })
      .catch((e) => setError(e instanceof Error ? e.message : dict.errors.loadFailed))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const update = (field: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/stock/materials", {
        name: form.name,
        categoryId: form.categoryId || undefined,
        unit: form.unit,
        defaultSupplier: form.defaultSupplier || undefined,
        purchasePriceHT: priceHT,
        unitPrice: priceHT,
        tvaRate,
        minQty: numberValue(form.minQty),
        currentQty: numberValue(form.currentQty),
      });
      setForm(initialForm);
      setShowForm(false);
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(dict.labels.confirmDelete)) return;
    setDeleting(id);
    try {
      await api.delete(`/stock/materials/${id}`);
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : dict.errors.deleteFailed);
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<MaterialCatalog>[] = [
    { key: "name", header: dict.stock.name, cell: (m) => <span className="font-medium text-foreground">{m.name}</span> },
    { key: "category", header: dict.stock.category, cell: (m) => m.category?.name || "-" },
    { key: "unit", header: dict.stock.unit, cell: (m) => m.unit },
    { key: "supplier", header: dict.stock.defaultSupplier, cell: (m) => m.defaultSupplier || "-" },
    { key: "ht", header: dict.stock.purchasePriceHT, className: "text-end", cell: (m) => formatMAD(numberValue(m.purchasePriceHT ?? m.unitPrice)) },
    { key: "tva", header: dict.stock.tva, className: "text-end", cell: (m) => `${numberValue(m.tvaRate ?? 20)}%` },
    { key: "ttc", header: dict.stock.purchasePriceTTC, className: "text-end font-medium", cell: (m) => formatMAD(ttcFromMaterial(m)) },
    { key: "min", header: dict.stock.minQty, className: "text-end", cell: (m) => Number(m.minQty).toLocaleString("fr-FR") },
    { key: "qty", header: dict.stock.currentQty, className: "text-end", cell: (m) => `${Number(m.currentQty).toLocaleString("fr-FR")} ${m.unit}` },
    { key: "actions", header: "", cell: (m) => <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleDelete(m.id)} disabled={deleting === m.id}><Trash2 className="size-3.5" /></Button> },
  ];

  const totalStockValue = materials.reduce((sum, material) => sum + Number(material.currentQty) * numberValue(material.purchasePriceHT ?? material.unitPrice), 0);
  const lowStockCount = materials.filter((material) => numberValue(material.minQty) > 0 && numberValue(material.currentQty) <= numberValue(material.minQty)).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.stock.materialCatalog} subtitle={dict.stock.materialCatalogSubtitle} actions={<Button onClick={() => setShowForm((value) => !value)} size="lg"><Plus className="size-4" />{dict.stock.newMaterial}</Button>} />

      {error && <ErrorState message={error} onRetry={fetchData} retryLabel={dict.actions.retry} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label={dict.stock.materials} value={materials.length} icon={Package} loading={loading} />
        <KpiCard label={dict.stock.stockValue} value={formatMAD(totalStockValue)} icon={Layers} loading={loading} />
        <KpiCard label={dict.stock.lowStockItems} value={lowStockCount} icon={AlertTriangle} loading={loading} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold">{dict.stock.examples}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => <span key={example} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{example}</span>)}
        </CardContent>
      </Card>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <FormSection title={dict.stock.newMaterial}>
            <TextField label={dict.stock.name} value={form.name} onChange={(v) => update("name", v)} required />
            <SelectField label={dict.stock.category} value={form.categoryId} onChange={(v) => update("categoryId", v)} options={[{ value: "", label: dict.labels.none }, ...categories.map((category) => ({ value: category.id, label: category.name }))]} />
            <TextField label={dict.stock.unit} value={form.unit} onChange={(v) => update("unit", v)} required />
            <TextField label={dict.stock.defaultSupplier} value={form.defaultSupplier} onChange={(v) => update("defaultSupplier", v)} />
            <TextField label={dict.stock.purchasePriceHT} value={form.purchasePriceHT} onChange={(v) => update("purchasePriceHT", v)} type="number" required />
            <TextField label={dict.stock.tva} value={form.tvaRate} onChange={(v) => update("tvaRate", v)} type="number" />
            <TextField label={dict.stock.minQty} value={form.minQty} onChange={(v) => update("minQty", v)} type="number" />
            <TextField label={dict.stock.currentQty} value={form.currentQty} onChange={(v) => update("currentQty", v)} type="number" />
          </FormSection>
          <Card className="mt-4">
            <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
              <div><div className="text-muted-foreground">{dict.stock.htTotal}</div><div className="font-bold">{formatMAD(totalHT)}</div></div>
              <div><div className="text-muted-foreground">{dict.stock.tva}</div><div className="font-bold">{formatMAD(tvaAmount)}</div></div>
              <div><div className="text-muted-foreground">{dict.stock.ttcTotal}</div><div className="font-bold">{formatMAD(totalTTC)}</div></div>
              <div className="sm:col-span-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-muted-foreground"><Calculator className="size-4" />{dict.stock.calculationHint}</div>
            </CardContent>
          </Card>
          <FormActions saving={saving} onCancel={() => setShowForm(false)} />
        </form>
      )}

      <DataTable
        columns={columns}
        data={materials}
        loading={loading}
        rowKey={(m) => m.id}
        emptyText={dict.stock.noMaterialsCatalog}
        renderMobileCard={(m) => (
          <MobileCard>
            <div className="flex items-center justify-between gap-2">
              <span className="block truncate text-sm font-bold text-foreground">{m.name}</span>
              <Button variant="ghost" size="sm" className="h-6 text-destructive" onClick={() => handleDelete(m.id)} disabled={deleting === m.id}><Trash2 className="size-3" /></Button>
            </div>
            <MobileCardRow label={dict.stock.category} value={m.category?.name || "-"} />
            <MobileCardRow label={dict.stock.unit} value={m.unit} />
            <MobileCardRow label={dict.stock.purchasePriceTTC} value={formatMAD(ttcFromMaterial(m))} />
            <MobileCardRow label={dict.stock.currentQty} value={`${Number(m.currentQty)} ${m.unit}`} />
          </MobileCard>
        )}
      />
    </div>
  );
}
