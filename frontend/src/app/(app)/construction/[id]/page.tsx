"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink } from "@/components/ui-kit/detail";
import { TextField, SelectField, TextareaField } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PHASE_NAME_MAP: Record<string, string> = {
  terrain: dict.phases.terrain, fondations: dict.phases.fondations, infrastructure: dict.phases.infrastructure,
  grosOeuvre: dict.phases.grosOeuvre, charpente: dict.phases.charpente, couverture: dict.phases.couverture,
  maçonnerie: dict.phases.maçonnerie, enduits: dict.phases.enduits, plomberie: dict.phases.plomberie,
  electricite: dict.phases.electricite, menuiserie: dict.phases.menuiserie, serrurerie: dict.phases.serrurerie,
  carrelage: dict.phases.carrelage, peinture: dict.phases.peinture, revetements: dict.phases.revetements,
  cuisine: dict.phases.cuisine, sanitaires: dict.phases.sanitaires, amenagementsExterieurs: dict.phases.amenagementsExterieurs,
  finition: dict.phases.finition,
};

const STATUS_OPTIONS = [
  { value: "not_started", label: dict.construction.notStarted },
  { value: "in_progress", label: dict.construction.inProgress },
  { value: "completed", label: dict.construction.completed },
];

interface Phase {
  id: string | null;
  projectId: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  notes: string | null;
}
interface PhasesResponse {
  phases: Phase[];
  globalProgress: number;
}

export default function ProjectConstructionPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<PhasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Phase>>({});
  const [saving, setSaving] = useState(false);

  const fetchPhases = () => {
    setLoading(true);
    api.get<PhasesResponse>(`/construction/projects/${id}/phases`).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPhases(); }, [id]);

  const startEdit = (phase: Phase) => {
    setEditing(phase.name);
    setEditForm({
      status: phase.status,
      progress: phase.progress,
      startDate: phase.startDate?.split("T")[0] ?? "",
      endDate: phase.endDate?.split("T")[0] ?? "",
      notes: phase.notes ?? "",
    });
  };

  const saveEdit = async (phaseName: string) => {
    setSaving(true);
    try {
      await api.patch(`/construction/projects/${id}/phases/${encodeURIComponent(phaseName)}`, {
        status: editForm.status,
        progress: Number(editForm.progress),
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        notes: editForm.notes || null,
      });
      setEditing(null);
      fetchPhases();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner text={dict.actions.loading} />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!data) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/construction" label={dict.construction.title} />
      <PageHeader title={dict.construction.phases} />

      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <div>
            <div className="text-sm font-medium text-muted-foreground">{dict.construction.progress}</div>
            <div className="text-3xl font-bold">{data.globalProgress}{dict.units.percent}</div>
          </div>
          <div className="flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${data.globalProgress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.phases.map((phase) => (
          <Card key={phase.name}>
            <CardContent className="p-5">
              {editing === phase.name ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{PHASE_NAME_MAP[phase.name] || phase.name}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>{dict.actions.cancel}</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SelectField label={dict.construction.status} value={editForm.status || ""} onChange={(v) => setEditForm({ ...editForm, status: v })} options={STATUS_OPTIONS} />
                    <TextField label={dict.construction.progressPercentage} type="number" value={String(editForm.progress ?? 0)} onChange={(v) => setEditForm({ ...editForm, progress: Number(v) })} />
                    <TextField label={dict.construction.startDate} type="date" value={editForm.startDate || ""} onChange={(v) => setEditForm({ ...editForm, startDate: v })} />
                    <TextField label={dict.construction.endDate} type="date" value={editForm.endDate || ""} onChange={(v) => setEditForm({ ...editForm, endDate: v })} />
                  </div>
                  <TextareaField label={dict.construction.notes} value={editForm.notes || ""} onChange={(v) => setEditForm({ ...editForm, notes: v })} rows={2} />
                  <Button onClick={() => saveEdit(phase.name)} disabled={saving}>{saving ? dict.actions.saving : dict.construction.updateProgress}</Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold">{PHASE_NAME_MAP[phase.name] || phase.name}</h3>
                      <StatusBadge status={phase.status} />
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => startEdit(phase)}>
                      <Pencil className="size-3.5" />{dict.actions.edit}
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${phase.progress}%` }} />
                    </div>
                    <span className="text-sm font-semibold">{phase.progress}{dict.units.percent}</span>
                  </div>
                  {(phase.startDate || phase.endDate) && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {phase.startDate && <span>{dict.construction.startDate}: {formatDate(phase.startDate)} </span>}
                      {phase.endDate && <span>{dict.construction.endDate}: {formatDate(phase.endDate)}</span>}
                    </div>
                  )}
                  {phase.notes && <div className="mt-1 text-sm text-muted-foreground">{phase.notes}</div>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
