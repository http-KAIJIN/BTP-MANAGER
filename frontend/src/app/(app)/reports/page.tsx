"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Project, Supplier, Intervenant, PaginatedResponse } from "@/lib/types";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { ErrorState } from "@/components/ui-kit/error-state";
import { SelectField } from "@/components/ui-kit/form-fields";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface ProjectReport {
  project: { id: string; name: string; city: string; status: string; startDate: string; expectedEndDate: string | null; executingCompany: string | null; ownerCompany: string | null };
  financial: { totalCommitments: number; totalPaid: number; totalRemaining: number; totalExpenses: number };
  constructionProgress: number;
  commitments: { id: string; description: string; beneficiaryName: string | null; agreedAmount: number; status: string }[];
  payments: { id: string; amount: number; paymentDate: string; paymentMode: string }[];
  expensesByCategory: { category: string; total: number }[];
}
interface EntityReport {
  financial: { totalCommitments: number; totalPaid: number; totalRemaining: number };
  supplier?: { id: string; name: string };
  intervenant?: { id: string; name: string; trade: string };
}

type ReportType = "project" | "supplier" | "intervenant";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-2 text-xl font-bold">{formatMAD(value)}</div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>("project");
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState<ProjectReport | EntityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Project>>("/projects", { limit: "100" }),
      api.get<PaginatedResponse<Supplier>>("/suppliers", { limit: "100" }),
      api.get<PaginatedResponse<Intervenant>>("/intervenants", { limit: "100" }),
    ]).then(([p, s, i]) => { setProjects(p.data); setSuppliers(s.data); setIntervenants(i.data); }).catch(() => {});
  }, []);

  const generateReport = () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    setReport(null);
    const endpoint =
      type === "project" ? `/reports/projects/${selectedId}`
      : type === "supplier" ? `/reports/suppliers/${selectedId}`
      : `/reports/intervenants/${selectedId}`;
    api.get<ProjectReport | EntityReport>(endpoint).then(setReport).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  const csvUrl = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
    return `${API_BASE}/reports/projects/csv?token=${token}`;
  };

  const typeLabel = type === "project" ? dict.reports.project : type === "supplier" ? dict.reports.supplier : dict.reports.intervenant;
  const entities = type === "project" ? projects : type === "supplier" ? suppliers : intervenants;
  const entityOptions = entities.map((e) =>
    type === "project" ? { value: e.id, label: `${e.name} - ${(e as Project).city ?? ""}` }
    : type === "supplier" ? { value: e.id, label: (e as Supplier).name }
    : { value: e.id, label: `${(e as Intervenant).name} (${(e as Intervenant).trade ?? ""})` },
  );

  const expenseColumns: Column<{ category: string; total: number }>[] = [
    { key: "cat", header: dict.labels.category, cell: (e) => e.category },
    { key: "total", header: dict.financial.amount, cell: (e) => <span className="font-medium">{formatMAD(e.total)}</span> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={dict.reports.title}
        subtitle={dict.reports.financialSummary}
        actions={
          <Button asChild variant="outline">
            <a href={csvUrl()} download><Download className="size-4" />{dict.reports.exportCSV}</a>
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-5">
          <div className="w-full sm:w-56">
            <SelectField
              label={dict.labels.type}
              value={type}
              onChange={(v) => { setType(v as ReportType); setSelectedId(""); setReport(null); }}
              options={[
                { value: "project", label: dict.reports.projectReport },
                { value: "supplier", label: dict.reports.supplierReport },
                { value: "intervenant", label: dict.reports.intervenantReport },
              ]}
            />
          </div>
          <div className="w-full sm:w-72">
            <SelectField label={typeLabel} value={selectedId} onChange={setSelectedId} options={entityOptions} />
          </div>
          <Button onClick={generateReport} disabled={!selectedId || loading}>
            <FileBarChart className="size-4" />
            {loading ? dict.actions.loading : dict.actions.export}
          </Button>
        </CardContent>
      </Card>

      {loading && <LoadingSpinner text={dict.actions.loading} />}
      {error && <ErrorState message={error} />}

      {report && !loading && type === "project" && (() => {
        const r = report as ProjectReport;
        return (
          <div className="space-y-6">
            <Card><CardContent className="p-6">
              <h2 className="text-xl font-bold">{r.project.name}</h2>
              <p className="text-sm text-muted-foreground">{r.project.city ?? "-"} · {r.project.executingCompany ?? "-"}</p>
            </CardContent></Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label={dict.financial.totalCommitments} value={r.financial.totalCommitments} />
              <StatCard label={dict.financial.totalPaid} value={r.financial.totalPaid} />
              <StatCard label={dict.financial.totalRemaining} value={r.financial.totalRemaining} />
              <StatCard label={dict.financial.totalExpenses} value={r.financial.totalExpenses} />
            </div>
            {r.constructionProgress > 0 && (
              <Card><CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">{dict.construction.progress}</span>
                  <span className="font-bold">{r.constructionProgress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${r.constructionProgress}%` }} /></div>
              </CardContent></Card>
            )}
            {r.expensesByCategory.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold">{dict.financial.totalExpenses}</h3>
                <DataTable columns={expenseColumns} data={r.expensesByCategory} rowKey={(e) => e.category} maxHeight="none" />
              </div>
            )}
          </div>
        );
      })()}

      {report && !loading && type !== "project" && (() => {
        const r = report as EntityReport;
        const name = r.supplier?.name ?? r.intervenant?.name ?? "";
        const sub = r.intervenant?.trade ?? "";
        return (
          <div className="space-y-6">
            <Card><CardContent className="p-6">
              <h2 className="text-xl font-bold">{name}</h2>
              {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
            </CardContent></Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label={dict.financial.totalCommitments} value={r.financial.totalCommitments} />
              <StatCard label={dict.financial.totalPaid} value={r.financial.totalPaid} />
              <StatCard label={dict.financial.totalRemaining} value={r.financial.totalRemaining} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
