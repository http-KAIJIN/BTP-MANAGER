import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Toolbar slot (e.g. range selector), rendered at the inline-end of the header. */
  action?: ReactNode;
  loading?: boolean;
  /** True when there is no data to plot; shows an empty state instead of children. */
  empty?: boolean;
  emptyText?: string;
  /** Body height in px (the ResponsiveContainer fills it). */
  height?: number;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  loading,
  empty,
  emptyText = "ما كاين حتى معطى",
  height = 260,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base font-bold">{title}</CardTitle>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="w-full">
          {loading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : empty ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
