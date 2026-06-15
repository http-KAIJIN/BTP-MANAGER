"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Commitment } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CommitmentBalance {
  agreedAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
  beneficiaryName: string;
}

export default function CommitmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [balance, setBalance] = useState<CommitmentBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Commitment>(`/commitments/${params.id}`),
      api.get<CommitmentBalance>(`/commitments/${params.id}/balance`).catch(() => null),
    ])
      .then(([c, b]) => { setCommitment(c); setBalance(b); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/commitments/${params.id}`);
      router.push("/commitments");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!commitment) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/commitments" label={dict.commitments.title} />
      <PageHeader
        title={dict.commitments.detail}
        subtitle={`${dict.labels.createdAt} ${formatDate(commitment.createdAt)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/commitments/${params.id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DetailCard title={dict.labels.generalInfo}>
            <InfoItem label={dict.commitments.project} value={commitment.project?.name} />
            <InfoItem label={dict.commitments.status} value={<StatusBadge status={commitment.status} />} />
            <InfoItem label={dict.commitments.beneficiary} value={commitment.supplier?.name || commitment.intervenant?.name} />
            <InfoItem label={dict.commitments.commitmentDate} value={formatDate(commitment.commitmentDate)} />
            <InfoItem label={dict.financial.agreedAmount} value={formatMAD(commitment.agreedAmount)} />
            <InfoItem label={dict.commitments.description} value={commitment.description} full />
            <InfoItem label={dict.commitments.notes} value={commitment.notes} full />
          </DetailCard>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">{dict.financial.balance}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {balance ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">{dict.financial.amount}</span><span className="font-medium">{formatMAD(balance.agreedAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{dict.financial.totalPaid}</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{formatMAD(balance.totalPaid)}</span></div>
                <div className="flex justify-between border-t pt-3"><span className="text-muted-foreground">{dict.financial.remainingAmount}</span><span className={`font-semibold ${balance.remainingAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatMAD(balance.remainingAmount)}</span></div>
              </>
            ) : (
              <p className="text-muted-foreground">{dict.labels.noData}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <DeleteModal open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
