import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Accent = "orange" | "blue" | "green" | "amber" | "red" | "violet" | "slate";

const accentClasses: Record<Accent, string> = {
  orange: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  slate: "bg-muted text-muted-foreground",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: Accent;
  detail?: string;
  /** Tints the detail line (e.g. for warnings). */
  detailTone?: "muted" | "warning" | "positive";
  loading?: boolean;
  className?: string;
}

const detailToneClasses = {
  muted: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  positive: "text-emerald-600 dark:text-emerald-400",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "slate",
  detail,
  detailTone = "muted",
  loading,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("relative overflow-hidden transition-shadow hover:shadow-md", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-28" />
          ) : (
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          )}
          {detail && !loading ? (
            <p className={cn("mt-1 truncate text-xs font-medium", detailToneClasses[detailTone])}>
              {detail}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            accentClasses[accent],
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
