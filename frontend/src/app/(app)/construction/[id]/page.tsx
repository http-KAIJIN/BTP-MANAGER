"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, ClipboardList, Users, Package, Camera, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate, formatMAD } from "@/lib/format";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink } from "@/components/ui-kit/detail";
import { TextField, SelectField, TextareaField } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
interface PlannedVsActual {
  projectId: string;
  plannedPct: number;
  actualPct: number;
  delay: number;
  status: 'ahead' | 'on_track' | 'delayed';
}

interface AttendanceDashboard {
  presentToday: { id: string; name: string; trade: string | null; hoursWorked: number; dailyCost: number }[];
  totalWorkersToday: number;
  totalPresentToday: number;
  totalAbsentToday: number;
  totalDailyCost: number;
  totalHoursToday: number;
  totalProjectCost: number;
  totalProjectHours: number;
  date: string;
}

export default function ProjectConstructionPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<PhasesResponse | null>(null);
  const [plannedVsActual, setPlannedVsActual] = useState<PlannedVsActual | null>(null);
  const [attendanceDash, setAttendanceDash] = useState<AttendanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Phase>>({});
  const [saving, setSaving] = useState(false);

  const fetchPhases = () => {
    setLoading(true);
    Promise.all([
      api.get<PhasesResponse>(`/construction/projects/${id}/phases`),
      api.get<PlannedVsActual>(`/construction/projects/${id}/planned-vs-actual`).catch(() => null),
      api.get<AttendanceDashboard>(`/construction/attendance/dashboard`, { projectId: id }).catch(() => null),
    ])
      .then(([phases, pva, att]) => {
        setData(phases);
        setPlannedVsActual(pva);
        setAttendanceDash(att);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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

      {/* Progress & Planned vs Actual */}
      <div className="grid gap-4 sm:grid-cols-2">
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

        {plannedVsActual && (() => {
          const delay = plannedVsActual.delay;
          const isDelayed = delay < -5;
          const isOnTrack = delay >= -5 && delay <= 5;
          const isAhead = delay > 5;
          const bgColor = isAhead ? 'bg-emerald-500' : isOnTrack ? 'bg-amber-500' : 'bg-red-500';
          const Icon = isAhead ? CheckCircle2 : isOnTrack ? AlertTriangle : AlertTriangle;
          const label = isAhead ? dict.site.ahead : isOnTrack ? dict.site.onTrack : dict.site.delayed;
          return (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${bgColor} text-white`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{dict.site.progressTitle}</div>
                      <div className="text-xl font-bold">{label}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {dict.site.plannedProgress}: {plannedVsActual.plannedPct}{dict.units.percent}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dict.site.actualProgress}: {plannedVsActual.actualPct}{dict.units.percent}
                    </div>
                    <div className={`text-sm font-bold ${isAhead ? 'text-emerald-600' : isDelayed ? 'text-red-600' : 'text-amber-600'}`}>
                      {delay > 0 ? '+' : ''}{delay}{dict.units.percent}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Quick Action Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href={`/construction/site-journal/new?projectId=${id}`} className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <ClipboardList className="size-6 text-primary" />
              <span className="text-sm font-medium">{dict.site.newJournal}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/construction/attendance?projectId=${id}`} className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <Users className="size-6 text-primary" />
              <span className="text-sm font-medium">{dict.site.markAttendance}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/construction/materials?projectId=${id}`} className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <Package className="size-6 text-primary" />
              <span className="text-sm font-medium">{dict.site.newMaterial}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/construction/photos?projectId=${id}`} className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <Camera className="size-6 text-primary" />
              <span className="text-sm font-medium">{dict.site.sitePhotos}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Attendance Today Summary */}
      {attendanceDash && attendanceDash.totalWorkersToday > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-base font-bold">{dict.site.attendanceRegister} ({attendanceDash.date})</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted p-3 text-center">
                <div className="text-xs text-muted-foreground">{dict.site.workersPresent}</div>
                <div className="text-xl font-bold text-emerald-600">{attendanceDash.totalPresentToday}</div>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <div className="text-xs text-muted-foreground">{dict.site.workersAbsent}</div>
                <div className="text-xl font-bold text-red-600">{attendanceDash.totalAbsentToday}</div>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <div className="text-xs text-muted-foreground">{dict.site.totalHours}</div>
                <div className="text-xl font-bold">{Number(attendanceDash.totalHoursToday)}h</div>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <div className="text-xs text-muted-foreground">{dict.site.dailyCost}</div>
                <div className="text-xl font-bold">{formatMAD(Number(attendanceDash.totalDailyCost))}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
