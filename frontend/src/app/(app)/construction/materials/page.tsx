"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Package, DollarSign, Layers } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate, formatMAD } from "@/lib/format";
import type { Project, MaterialUsage, MaterialReports, PaginatedResponse } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { FilterSelect } from "@/components/ui-kit/list-controls";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { ErrorState } from "@/components/ui-kit/error-state";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, SelectField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaterialsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [data, setData] = useState<PaginatedResponse<MaterialUsage> | null>(null);
  const [reports, setReports] = useState<MaterialReports | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    materialName: "", quantity: "", unit: "m³", cost: "", supplierId: "", usageDate: new Date().toISOString().slice(0, 10), notes: "",
  });

  useEffect(() => {
    api.get<{ data: Project[] }>("/projects", { limit: "200" })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  const fetchData = () => {
    if (!projectId) { setData(null); setReports(null); return; }
    setLoading(true);
    setError("");
    Promise.all([
      api.get<PaginatedResponse<MaterialUsage>>("/construction/materials", { projectId, limit: "50" }),
      api.get<MaterialReports>("/construction/materials/reports", { projectId }),
    ])
      .then(([d, r]) => { setData(d); setReports(r); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/construction/materials", {
        projectId, ...form,
        quantity: Number(form.quantity) || 0,
        cost: Number(form.cost) || 0,
        supplierId: form.supplierId || undefined,
        usageDate: form.usageDate || undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm({ materialName: "", quantity: "", unit: "m³", cost: "", supplierId: "", usageDate: new Date().toISOString().slice(0, 10), notes: "" });
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const columns: Column<MaterialUsage>[] = [
    { key: "materialName", header: dict.site.materialName, cell: (m) => m.materialName },
    { key: "quantity", header: dict.site.quantity, cell: (m) => `${Number(m.quantity)} ${m.unit}` },
    { key: "cost", header: dict.site.cost, cell: (m) => formatMAD(Number(m.cost)) },
    { key: "supplierId", header: dict.site.supplier, cell: (m) => m.supplierId || "-" },
    { key: "usageDate", header: dict.site.usageDate, cell: (m) => formatDate(m.usageDate) },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.site.materials}
        actions={
          projectId ? (
            <Button onClick={() => setShowForm(!showForm)}><Plus className="size-4" />{dict.site.newMaterial}</Button>
          ) : null
        }
      />

      <FilterSelect
        options={[{ value: "", label: dict.labels.all }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
        value={projectId}
        onValueChange={(v) => { setProjectId(v); setShowForm(false); }}
      />

      {error && <ErrorState message={error} />}

      {showForm && (
        <form onSubmit={handleSubmit}>
          <FormSection title={dict.site.newMaterial}>
            <TextField label={dict.site.materialName} value={form.materialName} onChange={(v) => update("materialName", v)} required />
            <TextField label={dict.site.quantity} value={form.quantity} onChange={(v) => update("quantity", v)} type="number" required />
            <TextField label={dict.site.unit} value={form.unit} onChange={(v) => update("unit", v)} placeholder="m³, kg, unité..." />
            <TextField label={dict.site.cost} value={form.cost} onChange={(v) => update("cost", v)} type="number" required />
            <TextField label={dict.site.supplier} value={form.supplierId} onChange={(v) => update("supplierId", v)} />
            <TextField label={dict.site.usageDate} value={form.usageDate} onChange={(v) => update("usageDate", v)} type="date" />
            <TextareaField label={dict.site.notes} value={form.notes} onChange={(v) => update("notes", v)} rows={2} />
          </FormSection>
          <FormActions saving={saving} onCancel={() => setShowForm(false)} />
        </form>
      )}

      {reports && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <KpiCard label={dict.site.totalCost} value={formatMAD(Number(reports.totalCost))} icon={DollarSign} />
          <KpiCard label={dict.site.quantity} value={`${Number(reports.totalQuantity)}`} icon={Layers} />
          <KpiCard label={dict.labels.count} value={String(reports.totalEntries)} icon={Package} />
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data}
        loading={loading && !showForm}
        rowKey={(m) => m.id}
        emptyText={dict.site.noMaterials}
        renderMobileCard={(m) => (
          <MobileCard>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{m.materialName}</span>
              <span className="text-xs font-medium">{formatMAD(Number(m.cost))}</span>
            </div>
            <MobileCardRow label={dict.site.quantity} value={`${Number(m.quantity)} ${m.unit}`} />
            <MobileCardRow label={dict.site.usageDate} value={formatDate(m.usageDate)} />
          </MobileCard>
        )}
      />

      {reports && reports.byMaterial.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm font-bold">{dict.site.costByMaterial}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {reports.byMaterial.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="font-medium">{r.material}</span>
                  <span>{formatMAD(Number(r.cost))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-bold">{dict.site.costBySupplier}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {reports.bySupplier.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="font-medium">{r.supplierId}</span>
                  <span>{formatMAD(Number(r.cost))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
