import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Consistent inline error card used across pages. */
export function ErrorState({ message, className, onRetry, retryLabel = "أعاود حاول" }: { message: string; className?: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TriangleAlert className="size-5 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button> : null}
    </div>
  );
}
