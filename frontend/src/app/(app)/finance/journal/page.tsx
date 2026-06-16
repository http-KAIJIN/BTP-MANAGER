"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD, formatDate } from "@/lib/format";
import type { JournalEntry, PaginatedResponse } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { TableToolbar, FilterSelect } from "@/components/ui-kit/list-controls";
import { MobileCard, MobileCardRow } from "@/components/ui-kit/mobile-card";
import { ErrorState } from "@/components/ui-kit/error-state";

const typeOptions = [
  { value: "", label: dict.labels.all },
  { value: "INVOICE", label: "فاتورة" },
  { value: "PAYMENT", label: "أداء" },
  { value: "EXPENSE", label: "مصاريف" },
  { value: "COMMITMENT", label: "التزام" },
];

export default function JournalPage() {
  const [data, setData] = useState<PaginatedResponse<JournalEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<JournalEntry>>("/finance/journal", {
        search: search || undefined,
        type: type || undefined,
        page: String(page),
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, type, page]);

  const amountClass = (amount: number) =>
    amount >= 0
      ? "text-emerald-600 dark:text-emerald-400 font-medium"
      : "text-destructive font-medium";

  const typeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      INVOICE: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
      PAYMENT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      EXPENSE: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
      COMMITMENT: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    };
    const labelMap: Record<string, string> = {
      INVOICE: "فاتورة",
      PAYMENT: "أداء",
      EXPENSE: "مصاريف",
      COMMITMENT: "التزام",
    };
    return (
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[type] ?? "bg-slate-100 text-slate-600"}`}>
        {labelMap[type] ?? type}
      </span>
    );
  };

  const columns: Column<JournalEntry>[] = [
    { key: "date", header: dict.finance.journalDate, cell: (e) => formatDate(e.date) },
    { key: "type", header: dict.finance.journalType, cell: (e) => typeBadge(e.type) },
    { key: "project", header: dict.finance.journalProject, cell: (e) => e.projectName ?? "-" },
    { key: "counterparty", header: dict.finance.journalCounterparty, cell: (e) => e.counterparty ?? "-" },
    { key: "amount", header: dict.finance.journalAmount, className: "text-end", cell: (e) => <span className={amountClass(e.amount)}>{formatMAD(Math.abs(e.amount))}</span> },
    { key: "reference", header: dict.finance.journalReference, cell: (e) => e.reference },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.finance.journal} subtitle={data?.meta.total ? `${data.meta.total} ${dict.labels.count}` : undefined} />
      {error ? <ErrorState message={error} /> : (
        <DataTable
          columns={columns}
          data={data?.data}
          loading={loading}
          rowKey={(e) => `${e.date}-${e.source}-${e.reference}`}
          emptyText={dict.labels.noData}
          renderMobileCard={(e) => (
            <MobileCard>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                {typeBadge(e.type)}
              </div>
              <MobileCardRow label={dict.finance.journalProject} value={e.projectName ?? "-"} />
              {e.counterparty && <MobileCardRow label={dict.finance.journalCounterparty} value={e.counterparty} />}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted-foreground truncate">{e.reference}</span>
                <span className={amountClass(e.amount)}>{formatMAD(Math.abs(e.amount))}</span>
              </div>
            </MobileCard>
          )}
          total={data?.meta.total}
          page={data?.meta.page}
          pageCount={data?.meta.totalPages}
          onPageChange={setPage}
          toolbar={
            <div className="flex items-center gap-3">
              <TableToolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />
              <FilterSelect options={typeOptions} value={type} onValueChange={(v) => { setType(v); setPage(1); }} />
            </div>
          }
        />
      )}
    </div>
  );
}
