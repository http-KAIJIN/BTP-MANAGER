"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Send, Check, X, FileText } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { Quote } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuoteItem } from "@/lib/types";

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchQuote = () => {
    setLoading(true);
    api.get<Quote>(`/quotes/${id}`)
      .then(setQuote)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuote(); }, [id]);

  const doAction = async (action: string) => {
    setActionLoading(true);
    try {
      await api.post(`/quotes/${id}/${action}`);
      fetchQuote();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/quotes/${id}`);
      router.push("/quotes");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!quote) return null;

  const canEdit = quote.status === "DRAFT";
  const canDelete = quote.status === "DRAFT";
  const canSend = quote.status === "DRAFT";
  const canAccept = quote.status === "SENT";
  const canReject = quote.status === "SENT";
  const canConvert = quote.status === "ACCEPTED";

  const itemColumns: Column<QuoteItem>[] = [
    { key: "num", header: "#", className: "w-10 text-muted-foreground", cell: (it) => String(Number(it.sortOrder) + 1) },
    { key: "description", header: dict.quotes.description, cell: (it) => it.description },
    { key: "quantity", header: dict.quotes.quantity, className: "text-end", cell: (it) => Number(it.quantity).toLocaleString("fr-FR") },
    { key: "unitPrice", header: dict.quotes.unitPrice, className: "text-end", cell: (it) => formatMAD(Number(it.unitPrice)) },
    { key: "totalHT", header: dict.quotes.totalHT, className: "text-end font-medium", cell: (it) => formatMAD(Number(it.totalHT)) },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/quotes" label={dict.quotes.title} />
      <PageHeader
        title={quote.quoteNumber}
        subtitle={<StatusBadge status={quote.status} />}
        actions={
          <>
            {canEdit && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/quotes/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link>
              </Button>
            )}
            {canSend && (
              <Button size="sm" disabled={actionLoading} onClick={() => doAction("send")}>
                <Send className="size-4" />{dict.quotes.send}
              </Button>
            )}
            {canAccept && (
              <Button size="sm" disabled={actionLoading} onClick={() => doAction("accept")}>
                <Check className="size-4" />{dict.quotes.accept}
              </Button>
            )}
            {canReject && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={actionLoading} onClick={() => doAction("reject")}>
                <X className="size-4" />{dict.quotes.reject}
              </Button>
            )}
            {canConvert && (
              <Button size="sm" disabled={actionLoading} onClick={async () => {
                setActionLoading(true);
                try {
                  const inv = await api.post<{ id: string }>(`/invoices/from-quote/${id}`);
                  router.push(`/invoices/${inv.id}`);
                } catch (e: unknown) {
                  alert(e instanceof Error ? e.message : dict.errors.saveFailed);
                }
                setActionLoading(false);
              }}>
                <FileText className="size-4" />{dict.quotes.convertToInvoice}
              </Button>
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
            <InfoItem label={dict.quotes.client} value={quote.client.name} />
            <InfoItem label={dict.quotes.date} value={formatDate(quote.quoteDate)} />
            <InfoItem label={dict.quotes.validUntil} value={quote.validUntil ? formatDate(quote.validUntil) : "-"} />
            <InfoItem label={dict.labels.title} value={quote.title || "-"} />
            <InfoItem label={dict.labels.notes} value={quote.notes || "-"} full />
          </DetailCard>
          {quote.items.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold">{dict.quotes.items}</h2>
              <DataTable columns={itemColumns} data={quote.items} rowKey={(it) => it.id} />
            </div>
          )}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">{dict.labels.summary}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{dict.quotes.totalHT}</span>
                <span className="font-medium">{formatMAD(Number(quote.subtotalHT))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{dict.quotes.taxRate}</span>
                <span className="font-medium">{Number(quote.taxRate)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{dict.quotes.taxAmount}</span>
                <span className="font-medium">{formatMAD(Number(quote.taxAmount))}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>{dict.quotes.totalTTC}</span>
                <span className="text-lg">{formatMAD(Number(quote.totalTTC))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <DeleteModal open={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
