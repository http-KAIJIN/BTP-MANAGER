"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Payment } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";

function modeLabel(m: string) {
  return m === "CASH" ? dict.payments.cash : m === "CHEQUE" ? dict.payments.cheque : dict.payments.bankTransfer;
}

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Payment>(`/payments/${params.id}`).then(setPayment).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/payments/${params.id}`);
      router.push("/payments");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!payment) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/payments" label={dict.payments.title} />
      <PageHeader
        title={dict.payments.detail}
        subtitle={`${dict.labels.createdAt} ${formatDate(payment.createdAt)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/payments/${params.id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <DetailCard title={dict.labels.generalInfo}>
        <InfoItem label={dict.payments.project} value={payment.project?.name} />
        <InfoItem label={dict.payments.commitment} value={payment.commitment?.description} />
        <InfoItem label={dict.financial.amount} value={formatMAD(payment.amount)} />
        <InfoItem label={dict.payments.paymentDate} value={formatDate(payment.paymentDate)} />
        <InfoItem label={dict.financial.paymentMode} value={modeLabel(payment.paymentMode)} />
        <InfoItem label={dict.payments.beneficiary} value={payment.supplier?.name || payment.intervenant?.name} />
        {payment.chequeNumber && <InfoItem label={dict.financial.chequeNumber} value={payment.chequeNumber} />}
        <InfoItem label={dict.payments.notes} value={payment.notes} full />
      </DetailCard>
      <DeleteModal open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
