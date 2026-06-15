"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatNumber } from "@/lib/format";
import type { Client } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientFinancial {
  clientId: string;
  totalProjects: number;
  totalPayments: number;
}

type ClientProject = NonNullable<Client["projects"]>[number];

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [financial, setFinancial] = useState<ClientFinancial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Client>(`/clients/${id}`),
      api.get<ClientFinancial>(`/clients/${id}/financial-summary`),
    ])
      .then(([c, f]) => { setClient(c); setFinancial(f); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clients/${id}`);
      router.push("/clients");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!client) return null;

  const projectColumns: Column<ClientProject>[] = [
    { key: "name", header: dict.projects.name, cell: (p) => <Link href={`/projects/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link> },
    { key: "city", header: dict.projects.city, cell: (p) => p.city },
    { key: "status", header: dict.projects.status, cell: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/clients" label={dict.clients.title} />
      <PageHeader
        title={client.name}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/clients/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DetailCard title={dict.labels.generalInfo}>
            <InfoItem label={dict.clients.phone} value={client.phone} />
            <InfoItem label={dict.clients.CIN} value={client.cin} />
            <InfoItem label={dict.clients.address} value={client.address} />
            <InfoItem label={dict.labels.notes} value={client.notes} full />
          </DetailCard>
        </div>
        {financial && (
          <Card>
            <CardHeader><CardTitle className="text-base font-bold">{dict.clients.financialSummary}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-muted p-4">
                <div className="text-xs font-medium text-muted-foreground">{dict.clients.totalProjects}</div>
                <div className="mt-0.5 text-xl font-bold">{formatNumber(financial.totalProjects)}</div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
                <div className="text-xs font-medium opacity-80">{dict.clients.totalPayments}</div>
                <div className="mt-0.5 text-xl font-bold">{formatMAD(financial.totalPayments)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {client.projects && client.projects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold">{dict.clients.projects}</h2>
          <DataTable columns={projectColumns} data={client.projects} rowKey={(p) => p.id} onRowClick={(p) => router.push(`/projects/${p.id}`)} />
        </div>
      )}
      <DeleteModal open={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
