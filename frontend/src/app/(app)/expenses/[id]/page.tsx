"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Expense } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";

function modeLabel(m: string) {
  return m === "CASH" ? dict.expenses.cash : m === "CHEQUE" ? dict.expenses.cheque : dict.expenses.bankTransfer;
}

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Expense>(`/expenses/${params.id}`).then(setExpense).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/expenses/${params.id}`);
      router.push("/expenses");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!expense) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/expenses" label={dict.expenses.title} />
      <PageHeader
        title={dict.expenses.detail}
        subtitle={`${dict.labels.createdAt} ${formatDate(expense.createdAt)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/expenses/${params.id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <DetailCard title={dict.labels.generalInfo}>
        <InfoItem label={dict.expenses.project} value={expense.project?.name} />
        <InfoItem label={dict.expenses.category} value={expense.category?.name} />
        <InfoItem label={dict.expenses.supplier} value={expense.supplier?.name} />
        <InfoItem label={dict.financial.amount} value={formatMAD(expense.amount)} />
        <InfoItem label={dict.expenses.expenseDate} value={formatDate(expense.expenseDate)} />
        <InfoItem label={dict.financial.paymentMode} value={modeLabel(expense.paymentMode)} />
        <InfoItem label={dict.expenses.description} value={expense.description} full />
        <InfoItem label={dict.expenses.notes} value={expense.notes} full />
      </DetailCard>
      <DeleteModal open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
