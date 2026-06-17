"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Download, Pencil, Send, Trash2, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate, formatMAD } from "@/lib/format";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const id = useParams().id as string;
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPo = () => {
    setLoading(true);
    api.get<PurchaseOrder>(`/purchase-orders/${id}`).then(setPo).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPo(); }, [id]);

  const doAction = async (action: string) => {
    setActionLoading(true);
    try { await api.post(`/purchase-orders/${id}/${action}`); fetchPo(); } catch (e: unknown) { alert(e instanceof Error ? e.message : dict.errors.saveFailed); }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/purchase-orders/${id}`); router.push("/purchase-orders"); } catch (e: unknown) { alert(e instanceof Error ? e.message : dict.errors.deleteFailed); }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!po) return null;

  const canEdit = po.status === "DRAFT";
  const canSend = po.status === "DRAFT";
  const canApprove = po.status === "SENT";
  const canCancel = ["DRAFT", "SENT", "APPROVED"].includes(po.status);

  const itemColumns: Column<PurchaseOrderItem>[] = [
    { key: "num", header: "#", className: "w-10 text-muted-foreground", cell: (it) => String(Number(it.sortOrder) + 1) },
    { key: "description", header: dict.purchaseOrders.description, cell: (it) => it.description },
    { key: "quantity", header: dict.purchaseOrders.quantity, className: "text-end", cell: (it) => Number(it.quantity).toLocaleString("fr-FR") },
    { key: "received", header: dict.goodsReceipts.qtyReceived, className: "text-end", cell: (it) => Number(it.receivedQty).toLocaleString("fr-FR") },
    { key: "unitPrice", header: dict.purchaseOrders.unitPrice, className: "text-end", cell: (it) => formatMAD(Number(it.unitPrice)) },
    { key: "totalHT", header: dict.purchaseOrders.totalHT, className: "text-end font-medium", cell: (it) => formatMAD(Number(it.totalHT)) },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/purchase-orders" label={dict.purchaseOrders.title} />
      <PageHeader title={po.orderNumber} subtitle={<StatusBadge status={po.status} />} actions={<>
        <Button asChild variant="outline" size="sm"><a href={`/api/v1/purchase-orders/${id}/pdf`}><Download className="size-4" />{dict.purchaseOrders.downloadPdf}</a></Button>
        {canEdit && <Button asChild variant="outline" size="sm"><Link href={`/purchase-orders/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>}
        {canSend && <Button size="sm" disabled={actionLoading} onClick={() => doAction("send")}><Send className="size-4" />{dict.purchaseOrders.send}</Button>}
        {canApprove && <Button size="sm" disabled={actionLoading} onClick={() => doAction("approve")}><Check className="size-4" />{dict.purchaseOrders.approve}</Button>}
        {canCancel && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={actionLoading} onClick={() => doAction("cancel")}><X className="size-4" />{dict.purchaseOrders.cancel}</Button>}
        {canEdit && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>}
      </>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailCard title={dict.labels.generalInfo}>
            <InfoItem label={dict.purchaseOrders.supplier} value={po.supplier.name} />
            <InfoItem label={dict.purchaseOrders.project} value={po.project?.name || "-"} />
            <InfoItem label={dict.purchaseOrders.orderDate} value={formatDate(po.orderDate)} />
            <InfoItem label={dict.purchaseOrders.expectedDate} value={po.expectedDate ? formatDate(po.expectedDate) : "-"} />
            <InfoItem label={dict.purchaseOrders.orderTitle} value={po.title || "-"} />
            <InfoItem label={dict.purchaseOrders.notes} value={po.notes || "-"} full />
          </DetailCard>
          <DataTable columns={itemColumns} data={po.items} rowKey={(it) => it.id} />
        </div>
        <Card><CardHeader><CardTitle className="text-base font-bold">{dict.labels.summary}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="rounded-xl bg-muted p-4 space-y-2"><div className="flex justify-between text-sm"><span>{dict.purchaseOrders.totalHT}</span><span>{formatMAD(Number(po.subtotalHT))}</span></div><div className="flex justify-between text-sm"><span>{dict.purchaseOrders.taxRate}</span><span>{Number(po.taxRate)}%</span></div><div className="flex justify-between text-sm"><span>{dict.purchaseOrders.taxAmount}</span><span>{formatMAD(Number(po.taxAmount))}</span></div><div className="flex justify-between border-t pt-2 text-base font-bold"><span>{dict.purchaseOrders.totalTTC}</span><span>{formatMAD(Number(po.totalTTC))}</span></div></div></CardContent></Card>
      </div>
      <DeleteModal open={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />
    </div>
  );
}
