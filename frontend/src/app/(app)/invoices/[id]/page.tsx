"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Send, Download, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Invoice, InvoicePayment, InvoiceItem } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { TextField, SelectField, FormActions } from "@/components/ui-kit/form-fields";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), paymentMode: "BANK_TRANSFER", notes: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const fetchInvoice = () => {
    setLoading(true);
    api.get<Invoice>(`/invoices/${id}`)
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const doAction = async (action: string) => {
    setActionLoading(true);
    try {
      await api.post(`/invoices/${id}/${action}`);
      fetchInvoice();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/invoices/${id}`);
      router.push("/invoices");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const downloadPdf = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const url = `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/invoices/${id}/pdf`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${invoice?.invoiceNumber || "invoice"}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert(dict.errors.saveFailed));
  };

  const handlePayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) { return; }
    setPaymentSaving(true);
    try {
      await api.post(`/invoices/${id}/payments`, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMode: paymentForm.paymentMode,
        notes: paymentForm.notes || undefined,
      });
      setPaymentOpen(false);
      setPaymentForm({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), paymentMode: "BANK_TRANSFER", notes: "" });
      fetchInvoice();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setPaymentSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!invoice) return null;

  const canEdit = invoice.status === "DRAFT";
  const canDelete = invoice.status === "DRAFT";
  const canSend = invoice.status === "DRAFT";
  const canAddPayment = invoice.status === "SENT" || invoice.status === "PARTIALLY_PAID";

  const itemColumns: Column<InvoiceItem>[] = [
    { key: "num", header: "#", className: "w-10 text-muted-foreground", cell: (it) => String(Number(it.sortOrder) + 1) },
    { key: "description", header: dict.invoices.description, cell: (it) => it.description },
    { key: "quantity", header: dict.invoices.quantity, className: "text-end", cell: (it) => Number(it.quantity).toLocaleString("fr-FR") },
    { key: "unitPrice", header: dict.invoices.unitPrice, className: "text-end", cell: (it) => formatMAD(Number(it.unitPrice)) },
    { key: "totalHT", header: dict.invoices.totalHT, className: "text-end font-medium", cell: (it) => formatMAD(Number(it.totalHT)) },
  ];

  const paymentColumns: Column<InvoicePayment>[] = [
    { key: "date", header: dict.invoices.paymentDate, cell: (p) => formatDate(p.paymentDate) },
    { key: "mode", header: dict.invoices.paymentMode, cell: (p) => p.paymentMode },
    { key: "amount", header: dict.invoices.paymentAmount, className: "text-end font-medium text-emerald-600 dark:text-emerald-400", cell: (p) => formatMAD(Number(p.amount)) },
    { key: "notes", header: dict.labels.notes, cell: (p) => p.notes || "-" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/invoices" label={dict.invoices.title} />
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={<StatusBadge status={invoice.status} />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <Download className="size-4" />{dict.invoices.downloadPdf}
            </Button>
            {canEdit && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/invoices/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link>
              </Button>
            )}
            {canSend && (
              <Button size="sm" disabled={actionLoading} onClick={() => doAction("send")}>
                <Send className="size-4" />{dict.actions.save}
              </Button>
            )}
            {canAddPayment && (
              <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="size-4" />{dict.invoices.registerPayment}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{dict.invoices.registerPayment}</DialogTitle></DialogHeader>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <TextField label={dict.invoices.paymentAmount} value={paymentForm.amount} onChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))} type="number" required />
                    <TextField label={dict.invoices.paymentDate} value={paymentForm.paymentDate} onChange={(v) => setPaymentForm((f) => ({ ...f, paymentDate: v }))} type="date" />
                    <SelectField label={dict.invoices.paymentMode} value={paymentForm.paymentMode} onChange={(v) => setPaymentForm((f) => ({ ...f, paymentMode: v }))} options={[
                      { value: "CASH", label: "CASH" },
                      { value: "BANK_TRANSFER", label: "BANK_TRANSFER" },
                      { value: "CHEQUE", label: "CHEQUE" },
                      { value: "CREDIT_CARD", label: "CREDIT_CARD" },
                    ]} />
                    <TextField label={dict.invoices.paymentNotes} value={paymentForm.notes} onChange={(v) => setPaymentForm((f) => ({ ...f, notes: v }))} />
                    <FormActions saving={paymentSaving} saveLabel={dict.actions.save} onCancel={() => setPaymentOpen(false)} />
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {canDelete && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="size-4" />{dict.actions.delete}
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailCard title={dict.labels.generalInfo}>
            <InfoItem label={dict.invoices.client} value={invoice.client.name} />
            <InfoItem label={dict.invoices.date} value={formatDate(invoice.invoiceDate)} />
            <InfoItem label={dict.invoices.dueDate} value={invoice.dueDate ? formatDate(invoice.dueDate) : "-"} />
            <InfoItem label={dict.labels.title} value={invoice.title || "-"} />
            <InfoItem label={dict.labels.notes} value={invoice.notes || "-"} full />
          </DetailCard>
          {invoice.items.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold">{dict.invoices.items}</h2>
              <DataTable columns={itemColumns} data={invoice.items} rowKey={(it) => it.id} />
            </div>
          )}
          {invoice.payments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold">{dict.invoices.registerPayment}</h2>
              <DataTable columns={paymentColumns} data={invoice.payments} rowKey={(p) => p.id} />
            </div>
          )}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">{dict.labels.summary}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{dict.invoices.totalHT}</span><span className="font-medium">{formatMAD(Number(invoice.subtotalHT))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{dict.invoices.taxRate}</span><span className="font-medium">{Number(invoice.taxRate)}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{dict.invoices.taxAmount}</span><span className="font-medium">{formatMAD(Number(invoice.taxAmount))}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>{dict.invoices.totalTTC}</span><span className="text-lg">{formatMAD(Number(invoice.totalTTC))}</span></div>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
              <div className="text-xs font-medium opacity-80">{dict.invoices.paidAmount}</div>
              <div className="mt-0.5 text-xl font-bold">{formatMAD(Number(invoice.paidAmount))}</div>
            </div>
            {Number(invoice.remainingAmount) > 0 && (
              <div className="rounded-xl bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
                <div className="text-xs font-medium opacity-80">{dict.invoices.remainingAmount}</div>
                <div className="mt-0.5 text-xl font-bold">{formatMAD(Number(invoice.remainingAmount))}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <DeleteModal open={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
