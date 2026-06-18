"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Sale, SalePayment } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<(Sale & { totalPaid?: number; remainingBalance?: number }) | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payForm, setPayForm] = useState({ amount: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
  const [paySaving, setPaySaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Sale>(`/real-estate/sales/${id}`).then(setSale),
      api.get<SalePayment[]>(`/real-estate/sales/${id}/payments`).then(setPayments),
    ]).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault();
    setPaySaving(true);
    try {
      await api.post(`/real-estate/sales/${id}/payments`, { ...payForm, amount: Number(payForm.amount) });
      setPayForm({ amount: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setPaySaving(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm(dict.labels.confirmDelete)) return;
    try {
      await api.delete(`/real-estate/sales/${id}/payments/${paymentId}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!sale) return null;

  const paymentColumns: Column<SalePayment>[] = [
    { key: "date", header: dict.sales.paymentDate, cell: (p) => formatDate(p.paymentDate) },
    { key: "amount", header: dict.financial.amount, cell: (p) => <span className="font-medium">{formatMAD(Number(p.amount))}</span> },
    { key: "notes", header: dict.labels.notes, cell: (p) => p.notes || "-" },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (p) => (
        <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => handleDeletePayment(p.id)}>
          <Trash2 className="size-3.5" />
          {dict.actions.delete}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/sales" label={dict.sales.title} />
      <PageHeader
        title={`${dict.sales.detail} - ${sale.property?.reference ?? sale.client?.name ?? dict.sales.title}`}
        subtitle={<StatusBadge status={sale.status} />}
        actions={
          <Button asChild variant="outline" size="sm"><Link href={`/sales/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailCard title={dict.labels.generalInfo}>
          <InfoItem label={dict.sales.client} value={sale.client?.name} />
          <InfoItem label={dict.sales.property} value={sale.property?.reference} />
          <InfoItem label={dict.sales.salePrice} value={formatMAD(Number(sale.salePrice))} />
          <InfoItem label={dict.sales.downPayment} value={formatMAD(Number(sale.downPayment))} />
          <InfoItem label={dict.sales.saleDate} value={formatDate(sale.saleDate)} />
          <InfoItem label={dict.labels.notes} value={sale.notes} full />
        </DetailCard>
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">{dict.sales.financialSummary}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
              <div className="text-xs font-medium opacity-80">{dict.sales.totalPaid}</div>
              <div className="mt-0.5 text-xl font-bold">{formatMAD(Number(sale.totalPaid ?? 0))}</div>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
              <div className="text-xs font-medium opacity-80">{dict.sales.remainingBalance}</div>
              <div className="mt-0.5 text-xl font-bold">{formatMAD(Number(sale.remainingBalance ?? Number(sale.salePrice)))}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-bold">{dict.sales.payments}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddPayment} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{dict.sales.amount} *</Label>
              <Input type="number" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className="w-36" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{dict.sales.paymentDate}</Label>
              <Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} className="w-44" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{dict.labels.notes}</Label>
              <Input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="w-48" />
            </div>
            <Button type="submit" disabled={paySaving}>{paySaving ? dict.actions.saving : dict.sales.addPayment}</Button>
          </form>
          <DataTable columns={paymentColumns} data={payments} rowKey={(p) => p.id} emptyText={dict.sales.noPayments} maxHeight="none" />
        </CardContent>
      </Card>
    </div>
  );
}
