import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Consistent inline error card used across pages. */
export function ErrorState({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive",
        className,
      )}
    >
      <TriangleAlert className="size-5 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
