"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Intervenant, FinancialSummary } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem, FinancialSummaryCard } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";

export default function IntervenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [intervenant, setIntervenant] = useState<Intervenant | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Intervenant>(`/intervenants/${id}`),
      api.get<FinancialSummary>(`/intervenants/${id}/financial-summary`),
    ])
      .then(([i, f]) => { setIntervenant(i); setFinancial(f); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/intervenants/${id}`);
      router.push("/intervenants");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!intervenant) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/intervenants" label={dict.intervenants.title} />
      <PageHeader
        title={intervenant.name}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/intervenants/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DetailCard title={dict.intervenants.detail}>
            <InfoItem label={dict.intervenants.name} value={intervenant.name} />
            <InfoItem label={dict.intervenants.phone} value={intervenant.phone} />
            <InfoItem label={dict.intervenants.trade} value={intervenant.trade} />
            <InfoItem label={dict.intervenants.status} value={<StatusBadge status={intervenant.status} />} />
            <InfoItem label={dict.intervenants.notes} value={intervenant.notes} full />
          </DetailCard>
        </div>
        <FinancialSummaryCard summary={financial} title={dict.intervenants.financialSummary} />
      </div>
      <DeleteModal open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
