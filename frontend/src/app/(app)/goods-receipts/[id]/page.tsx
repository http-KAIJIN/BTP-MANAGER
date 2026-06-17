"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate, formatMAD } from "@/lib/format";
import type { GoodsReceipt, GoodsReceiptItem } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";

export default function GoodsReceiptDetailPage() {
  const id = useParams().id as string;
  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.get<GoodsReceipt>(`/goods-receipts/${id}`).then(setReceipt).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!receipt) return null;
  const columns: Column<GoodsReceiptItem>[] = [
    { key: "num", header: "#", className: "w-10 text-muted-foreground", cell: (it) => String(Number(it.sortOrder) + 1) },
    { key: "description", header: dict.goodsReceipts.items, cell: (it) => it.description },
    { key: "ordered", header: dict.goodsReceipts.qtyOrdered, className: "text-end", cell: (it) => Number(it.qtyOrdered).toLocaleString("fr-FR") },
    { key: "received", header: dict.goodsReceipts.qtyReceived, className: "text-end", cell: (it) => Number(it.qtyReceived).toLocaleString("fr-FR") },
    { key: "unitPrice", header: dict.goodsReceipts.unitPrice, className: "text-end", cell: (it) => formatMAD(Number(it.unitPrice)) },
    { key: "total", header: dict.goodsReceipts.totalHT, className: "text-end font-medium", cell: (it) => formatMAD(Number(it.totalHT)) },
  ];
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><BackLink href="/goods-receipts" label={dict.goodsReceipts.title} /><PageHeader title={receipt.receiptNumber} subtitle={<StatusBadge status={receipt.status} />} /><DetailCard title={dict.labels.generalInfo}><InfoItem label={dict.goodsReceipts.order} value={receipt.order.orderNumber} /><InfoItem label={dict.goodsReceipts.project} value={receipt.project?.name || "-"} /><InfoItem label={dict.goodsReceipts.receiptDate} value={formatDate(receipt.receiptDate)} /><InfoItem label={dict.goodsReceipts.supplierRef} value={receipt.supplierRef || "-"} /><InfoItem label={dict.goodsReceipts.notes} value={receipt.notes || "-"} full /></DetailCard><DataTable columns={columns} data={receipt.items} rowKey={(it) => it.id} /></div>;
}
