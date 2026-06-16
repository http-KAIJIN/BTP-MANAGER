"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dict } from "@/lib/dict";

export interface Column<T> {
  /** Stable column id. */
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  /** Extra classes for the cell (e.g. text alignment, width). */
  className?: string;
  /** Extra classes for the header cell. */
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined | null;
  rowKey: (row: T) => string;
  loading?: boolean;
  toolbar?: ReactNode;
  emptyText?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
  page?: number;
  pageCount?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  maxHeight?: string;
  className?: string;
  renderMobileCard?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  toolbar,
  emptyText,
  emptyIcon,
  onRowClick,
  skeletonRows = 6,
  page,
  pageCount,
  total,
  onPageChange,
  maxHeight = "calc(100vh - 320px)",
  className,
  renderMobileCard,
}: DataTableProps<T>) {
  const isEmpty = !loading && (!data || data.length === 0);
  const showPagination = page != null && pageCount != null && pageCount > 1;

  const desktopTable = (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-auto" style={{ maxHeight }}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      <Skeleton className="h-5 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isEmpty ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {emptyIcon ?? <Inbox className="size-6" />}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {emptyText ?? dict.labels.noData}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data!.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("py-3", col.className)}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination ? (
        <div className="flex items-center justify-between gap-3 border-t bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {total != null ? `${total.toLocaleString("fr-FR")} ${dict.labels.total}` : null}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page! <= 1}
              onClick={() => onPageChange?.(page! - 1)}
              aria-label="السابق"
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="min-w-20 text-center text-sm tabular-nums text-muted-foreground">
              {page} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page! >= pageCount!}
              onClick={() => onPageChange?.(page! + 1)}
              aria-label="التالي"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const mobileCards = renderMobileCard ? (
    <div className="space-y-3">
      {loading ? (
        Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={`sk-${i}`} className="rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {emptyIcon ?? <Inbox className="size-6" />}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {emptyText ?? dict.labels.noData}
          </p>
        </div>
      ) : (
        data!.map((row) => (
          <div key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {renderMobileCard(row)}
          </div>
        ))
      )}
      {showPagination ? (
        <div className="flex items-center justify-between gap-3 border-t bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {total != null ? `${total.toLocaleString("fr-FR")} ${dict.labels.total}` : null}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8" disabled={page! <= 1} onClick={() => onPageChange?.(page! - 1)} aria-label="السابق">
              <ChevronRight className="size-4" />
            </Button>
            <span className="min-w-20 text-center text-sm tabular-nums text-muted-foreground">{page} / {pageCount}</span>
            <Button variant="outline" size="icon" className="size-8" disabled={page! >= pageCount!} onClick={() => onPageChange?.(page! + 1)} aria-label="التالي">
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar}

      {renderMobileCard ? (
        <>
          <div className="desktop-table-view">{desktopTable}</div>
          <div className="mobile-card-view">{mobileCards}</div>
        </>
      ) : (
        desktopTable
      )}
    </div>
  );
}
