import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dict } from "@/lib/dict";

/**
 * Centralizes the status → color + Arabic label mapping that was previously
 * duplicated inline across projects, commitments, sales, etc.
 *
 * Accepts the raw backend status (any case / separators) and resolves a
 * tone + localized label. Unknown statuses fall back to a neutral badge.
 */

type Tone = "blue" | "green" | "amber" | "red" | "purple" | "slate";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
};

/** Normalized-status → tone + dict label key. */
const statusMap: Record<string, { tone: Tone; label: string }> = {
  in_progress: { tone: "blue", label: dict.status.inProgress },
  encours: { tone: "blue", label: dict.status.inProgress },
  en_cours: { tone: "amber", label: dict.status.inProgress },
  open: { tone: "amber", label: dict.status.open },
  planned: { tone: "purple", label: dict.status.notStarted },
  draft: { tone: "slate", label: dict.status.notStarted },
  paused: { tone: "amber", label: dict.status.onHold },
  not_started: { tone: "purple", label: dict.status.notStarted },
  completed: { tone: "green", label: dict.status.completed },
  termine: { tone: "green", label: dict.status.completed },
  paid: { tone: "green", label: dict.status.paid },
  validated: { tone: "green", label: dict.construction.validated },
  partially_paid: { tone: "amber", label: dict.status.partiallyPaid },
  on_hold: { tone: "amber", label: dict.status.onHold },
  blocked: { tone: "amber", label: dict.construction.blocked },
  cancelled: { tone: "red", label: dict.status.cancelled },
  annule: { tone: "red", label: dict.status.cancelled },
  active: { tone: "green", label: dict.status.active },
  inactive: { tone: "slate", label: dict.status.inactive },
  archived: { tone: "slate", label: dict.status.archived },
  available: { tone: "green", label: dict.status.available },
  dispo: { tone: "green", label: dict.status.available },
  disponible: { tone: "green", label: dict.status.available },
  reserved: { tone: "amber", label: dict.status.reserved },
  reserve: { tone: "amber", label: dict.status.reserved },
  sold: { tone: "blue", label: dict.status.sold },
  vendu: { tone: "blue", label: dict.status.sold },
  sent: { tone: "blue", label: dict.status.sent },
  accepted: { tone: "green", label: dict.status.accepted },
  rejected: { tone: "red", label: dict.status.rejected },
  converted_to_invoice: { tone: "purple", label: dict.status.converted },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const key = (status ?? "").toString().toLowerCase().replace(/[\s-]+/g, "_");
  const entry = statusMap[key];
  const tone = entry?.tone ?? "slate";
  const label = entry?.label ?? (status ?? "-").toString().replace(/_/g, " ");

  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent font-medium", toneClasses[tone], className)}
    >
      {label}
    </Badge>
  );
}
