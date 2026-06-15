"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Pencil,
  Trash2,
  FolderOpen,
  FileSignature,
  BanknoteArrowUp,
  ReceiptText,
  Wallet,
  Home as HomeIcon,
  HardHat,
  Banknote,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type {
  Project,
  FinancialSummary,
  Commitment,
  Payment,
  Expense,
  Property,
  PaginatedResponse,
} from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Phase {
  id: string | null;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
}
interface PhasesResponse {
  phases: Phase[];
  globalProgress: number;
}
interface ProjectDocument {
  id: string;
  name: string;
  originalName: string;
  category: string;
  size: number;
  createdAt: string;
}

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [phases, setPhases] = useState<PhasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Project>(`/projects/${id}`),
      api.get<FinancialSummary>(`/projects/${id}/financial-summary`),
      api.get<PhasesResponse>(`/construction/projects/${id}/phases`).catch(() => null),
    ])
      .then(([p, f, ph]) => {
        setProject(p);
        setFinancial(f);
        setPhases(ph);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      router.push("/projects");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      </div>
    );
  if (!project) return null;

  const stats = [
    { label: dict.financial.totalCommitments, value: financial?.totalCommitments, icon: FileSignature, accent: "text-primary bg-primary/10" },
    { label: dict.financial.totalPaid, value: financial?.totalPaid, icon: BanknoteArrowUp, accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    { label: dict.financial.totalRemaining, value: financial?.totalRemaining, icon: Wallet, accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
    { label: dict.financial.totalExpenses, value: financial?.totalExpenses ?? 0, icon: ReceiptText, accent: "text-red-600 dark:text-red-400 bg-red-500/10" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowRight className="size-4" />
        {dict.actions.back}
      </Link>

      <PageHeader
        title={project.name}
        subtitle={
          <span className="flex items-center gap-2">
            {project.city}
            <StatusBadge status={project.status} />
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${id}/documents`}>
                <FolderOpen className="size-4" />
                {dict.projects.documents}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${id}/edit`}>
                <Pencil className="size-4" />
                {dict.actions.edit}
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              {dict.actions.delete}
            </Button>
          </>
        }
      />

      {/* Summary band: financial mini-stats + progress */}
      <div className="grid gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="truncate text-lg font-bold">{formatMAD(s.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {phases ? (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <HardHat className="size-5 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{dict.construction.projectProgress}</span>
                <span className="font-bold tabular-nums">{phases.globalProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${phases.globalProgress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Tabs — horizontally scrollable on mobile */}
      <Tabs defaultValue="info" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <TabsList className="inline-flex h-auto w-max min-w-full gap-1 bg-muted/60 p-1 lg:w-full lg:flex-wrap lg:justify-start">
            <TabsTrigger value="info">{dict.labels.information}</TabsTrigger>
            <TabsTrigger value="commitments">{dict.commitments.title}</TabsTrigger>
            <TabsTrigger value="payments">{dict.payments.title}</TabsTrigger>
            <TabsTrigger value="expenses">{dict.expenses.title}</TabsTrigger>
            <TabsTrigger value="documents">{dict.documents.title}</TabsTrigger>
            <TabsTrigger value="construction">{dict.construction.title}</TabsTrigger>
            <TabsTrigger value="properties">{dict.properties.title}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info" className="mt-4">
          <InfoTab project={project} />
        </TabsContent>

        <TabsContent value="commitments" className="mt-4">
          <CommitmentsTab projectId={id} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab projectId={id} />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab projectId={id} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab projectId={id} />
        </TabsContent>
        <TabsContent value="construction" className="mt-4">
          <ConstructionTab projectId={id} phases={phases} />
        </TabsContent>
        <TabsContent value="properties" className="mt-4">
          <PropertiesTab projectId={id} />
        </TabsContent>
      </Tabs>

      <DeleteModal
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
        message={dict.labels.confirmDelete}
      />
    </div>
  );
}

/* ── Info tab ── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value || "-"}</dd>
    </div>
  );
}

function InfoTab({ project }: { project: Project }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">{dict.labels.generalInfo}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label={dict.projects.name} value={project.name} />
            <InfoRow label={dict.projects.city} value={project.city} />
            <InfoRow label={dict.projects.address} value={project.address} />
            <InfoRow label={dict.projects.status} value={<StatusBadge status={project.status} />} />
            <InfoRow label={dict.projects.projectType} value={project.projectType} />
            <InfoRow label={dict.projects.startDate} value={formatDate(project.startDate)} />
            <InfoRow label={dict.projects.expectedEndDate} value={formatDate(project.expectedEndDate)} />
            <InfoRow label={dict.projects.actualEndDate} value={formatDate(project.actualEndDate)} />
            <div className="col-span-2">
              <InfoRow label={dict.projects.description} value={project.description} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">{dict.labels.information}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <InfoRow
              label={dict.projects.ownerCompany}
              value={
                project.ownershipType === "internal_company"
                  ? project.ownerCompany?.name
                  : project.externalClientName
              }
            />
            {project.ownershipType === "external_client" && (
              <>
                <InfoRow label={dict.labels.phone} value={project.externalClientPhone} />
                <InfoRow label={dict.companies.title} value={project.externalClientCompany} />
              </>
            )}
            <InfoRow label={dict.projects.executingCompany} value={project.executingCompany?.name} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Generic scoped list tab ── */

function useScoped<T>(endpoint: string, projectId: string) {
  const [rows, setRows] = useState<T[]>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<PaginatedResponse<T>>(endpoint, { projectId, limit: "100" })
      .then((r) => alive && setRows(r.data ?? []))
      .catch(() => alive && setRows([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [endpoint, projectId]);
  return { rows, loading };
}

function CommitmentsTab({ projectId }: { projectId: string }) {
  const { rows, loading } = useScoped<Commitment>("/commitments", projectId);
  const columns: Column<Commitment>[] = [
    { key: "desc", header: dict.commitments.description, cell: (c) => <span className="font-medium">{c.description}</span> },
    { key: "ben", header: dict.commitments.beneficiary, cell: (c) => c.supplier?.name ?? c.intervenant?.name ?? "-" },
    { key: "amount", header: dict.commitments.agreedAmount, cell: (c) => formatMAD(c.agreedAmount) },
    { key: "date", header: dict.commitments.commitmentDate, cell: (c) => formatDate(c.commitmentDate) },
    { key: "status", header: dict.labels.status, cell: (c) => <StatusBadge status={c.status} /> },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(c) => c.id}
      emptyText={dict.commitments.noCommitments}
      renderMobileCard={(c) => (
        <MobileCard>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{c.description}</span>
            <StatusBadge status={c.status} />
          </div>
          <MobileCardRow label={dict.commitments.beneficiary} value={c.supplier?.name ?? c.intervenant?.name ?? "-"} />
          <MobileCardRow label={dict.commitments.agreedAmount} value={formatMAD(c.agreedAmount)} />
          <MobileCardRow label={dict.commitments.commitmentDate} value={formatDate(c.commitmentDate)} />
        </MobileCard>
      )}
    />
  );
}

function PaymentsTab({ projectId }: { projectId: string }) {
  const { rows, loading } = useScoped<Payment>("/payments", projectId);
  const columns: Column<Payment>[] = [
    { key: "ben", header: dict.payments.beneficiary, cell: (p) => p.supplier?.name ?? p.intervenant?.name ?? p.commitment?.description ?? "-" },
    { key: "amount", header: dict.payments.amount, cell: (p) => <span className="font-medium">{formatMAD(p.amount)}</span> },
    { key: "mode", header: dict.payments.paymentMode, cell: (p) => p.paymentMode },
    { key: "date", header: dict.payments.paymentDate, cell: (p) => formatDate(p.paymentDate) },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(p) => p.id}
      emptyText={dict.payments.noPayments}
      renderMobileCard={(p) => (
        <MobileCard>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{p.supplier?.name ?? p.intervenant?.name ?? p.commitment?.description ?? "-"}</span>
            <span className="text-sm font-bold">{formatMAD(p.amount)}</span>
          </div>
          <MobileCardRow label={dict.payments.paymentMode} value={p.paymentMode} />
          <MobileCardRow label={dict.payments.paymentDate} value={formatDate(p.paymentDate)} />
        </MobileCard>
      )}
    />
  );
}

function ExpensesTab({ projectId }: { projectId: string }) {
  const { rows, loading } = useScoped<Expense>("/expenses", projectId);
  const columns: Column<Expense>[] = [
    { key: "desc", header: dict.expenses.description, cell: (e) => <span className="font-medium">{e.description}</span> },
    { key: "cat", header: dict.expenses.category, cell: (e) => e.category?.name ?? "-" },
    { key: "amount", header: dict.expenses.amount, cell: (e) => formatMAD(e.amount) },
    { key: "date", header: dict.expenses.expenseDate, cell: (e) => formatDate(e.expenseDate) },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(e) => e.id}
      emptyText={dict.expenses.noExpenses}
      renderMobileCard={(e) => (
        <MobileCard>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{e.description}</span>
            <span className="text-sm font-bold">{formatMAD(e.amount)}</span>
          </div>
          <MobileCardRow label={dict.expenses.category} value={e.category?.name ?? "-"} />
          <MobileCardRow label={dict.expenses.expenseDate} value={formatDate(e.expenseDate)} />
        </MobileCard>
      )}
    />
  );
}

function PropertiesTab({ projectId }: { projectId: string }) {
  const { rows, loading } = useScoped<Property>("/real-estate/properties", projectId);
  const columns: Column<Property>[] = [
    { key: "ref", header: dict.labels.reference, cell: (p) => <span className="font-medium">{p.reference}</span> },
    { key: "type", header: dict.labels.type, cell: (p) => p.type },
    { key: "surface", header: dict.labels.surface, cell: (p) => `${p.surface} ${dict.units.m2}` },
    { key: "price", header: dict.financial.salePrice, cell: (p) => formatMAD(p.price) },
    { key: "status", header: dict.labels.status, cell: (p) => <StatusBadge status={p.status} /> },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(p) => p.id}
      emptyText={dict.labels.noData}
      renderMobileCard={(p) => (
        <MobileCard>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{p.reference}</span>
            <StatusBadge status={p.status} />
          </div>
          <MobileCardRow label={dict.labels.type} value={p.type} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{`${p.surface} ${dict.units.m2}`}</span>
            <span className="text-sm font-bold">{formatMAD(p.price)}</span>
          </div>
        </MobileCard>
      )}
    />
  );
}

/* ── Documents tab ── */

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + " " + dict.units.mb;
  return Math.max(1, Math.round(bytes / 1024)) + " " + dict.units.kb;
}

function DocumentsTab({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<ProjectDocument[]>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    api
      .get<ProjectDocument[]>(`/documents/projects/${projectId}`)
      .then((d) => alive && setDocs(d ?? []))
      .catch(() => alive && setDocs([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [projectId]);

  const columns: Column<ProjectDocument>[] = [
    { key: "name", header: dict.documents.name, cell: (d) => <span className="font-medium">{d.name || d.originalName}</span> },
    { key: "cat", header: dict.documents.category, cell: (d) => d.category },
    { key: "size", header: dict.documents.size, cell: (d) => formatSize(d.size) },
    { key: "date", header: dict.labels.createdAt, cell: (d) => formatDate(d.createdAt) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}/documents`}>
            <FolderOpen className="size-4" />
            {dict.documents.upload}
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={docs}
        loading={loading}
        rowKey={(d) => d.id}
        emptyText={dict.labels.noData}
        emptyIcon={<FolderOpen className="size-6" />}
        renderMobileCard={(d) => (
          <MobileCard>
            <span className="text-sm font-bold block truncate">{d.name || d.originalName}</span>
            <MobileCardRow label={dict.documents.category} value={d.category} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
              <span className="text-xs font-medium">{formatSize(d.size)}</span>
            </div>
          </MobileCard>
        )}
      />
    </div>
  );
}

/* ── Construction tab ── */

function ConstructionTab({ projectId, phases }: { projectId: string; phases: PhasesResponse | null }) {
  if (!phases || phases.phases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <HardHat className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{dict.construction.noPhases}</p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/construction/${projectId}`}>{dict.construction.updateProgress}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <Button asChild variant="outline" size="sm">
          <Link href={`/construction/${projectId}`}>
            <HardHat className="size-4" />
            {dict.construction.updateProgress}
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {phases.phases.map((ph) => (
          <Card key={ph.name}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{ph.name}</span>
                <StatusBadge status={ph.status} />
              </div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{dict.construction.progress}</span>
                <span className="tabular-nums">{ph.progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${ph.progress}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
