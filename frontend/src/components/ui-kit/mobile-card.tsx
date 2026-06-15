import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ children, href, onClick, className }: MobileCardProps) {
  const base = cn(
    "rounded-xl border bg-card shadow-sm transition-colors hover:bg-muted/50 active:bg-muted/80",
    (href || onClick) && "cursor-pointer",
    className,
  );

  const inner = <CardContent className="space-y-2 p-4">{children}</CardContent>;

  if (href) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={base} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      {inner}
    </div>
  );
}

export function MobileCardRow({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", full && "flex-col items-start")}>
      <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-sm font-medium text-foreground text-end", full && "text-start w-full")}>{value || "-"}</span>
    </div>
  );
}

export function MobileCardBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}
