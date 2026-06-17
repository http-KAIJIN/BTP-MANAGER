"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Users, Clock, DollarSign, Pencil } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Project, Intervenant, AttendanceDashboard, AttendanceRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FilterSelect } from "@/components/ui-kit/list-controls";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { ErrorState } from "@/components/ui-kit/error-state";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [dash, setDash] = useState<AttendanceDashboard | null>(null);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ hoursWorked: string; dailyCost: string }>({ hoursWorked: "", dailyCost: "" });

  useEffect(() => {
    api.get<{ data: Project[] }>("/projects", { limit: "200" })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) { setDash(null); setIntervenants([]); setExistingRecords([]); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.get<AttendanceDashboard>("/construction/attendance/dashboard", { projectId }),
      api.get<{ data: Intervenant[] }>("/intervenants", { limit: "200" }),
      api.get<AttendanceRecord[]>("/construction/attendance", { projectId, date: today }).catch(() => []),
    ])
      .then(([d, iv, rec]) => { setDash(d); setIntervenants(iv.data); setExistingRecords(rec); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const isAlreadyMarked = (intervenantId: string) =>
    existingRecords.some((r) => r.intervenantId === intervenantId);

  const handleBatchAttendance = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const date = new Date().toISOString().slice(0, 10);
      const records = intervenants.map((iv) => {
        const el = document.querySelector<HTMLInputElement>(`[data-present="${iv.id}"]`);
        const hoursInput = document.querySelector<HTMLInputElement>(`[data-hours="${iv.id}"]`);
        const costInput = document.querySelector<HTMLInputElement>(`[data-cost="${iv.id}"]`);
        const isPresent = el?.checked ?? false;
        return {
          intervenantId: iv.id,
          isPresent,
          hoursWorked: isPresent ? Number(hoursInput?.value || 8) : 0,
          dailyCost: isPresent ? Number(costInput?.value || 0) : 0,
        };
      });
      await api.post("/construction/attendance/batch", { projectId, date, records });
      setSuccess(dict.labels.success);
      const d = await api.get<AttendanceDashboard>("/construction/attendance/dashboard", { projectId });
      setDash(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  const handleEditAttendance = async (recordId: string) => {
    try {
      await api.patch(`/construction/attendance/${recordId}`, {
        hoursWorked: Number(editValues.hoursWorked) || 0,
        dailyCost: Number(editValues.dailyCost) || 0,
      });
      setEditingId(null);
      const d = await api.get<AttendanceDashboard>("/construction/attendance/dashboard", { projectId });
      setDash(d);
    } catch {
      alert(dict.errors.saveFailed);
    }
  };

  const startEdit = (id: string, hoursWorked: number, dailyCost: number) => {
    setEditingId(id);
    setEditValues({
      hoursWorked: String(Number(hoursWorked || 0)),
      dailyCost: String(Number(dailyCost || 0)),
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.site.attendance} />

      <FilterSelect
        options={[{ value: "", label: dict.labels.all }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
        value={projectId}
        onValueChange={(v) => { setProjectId(v); setDash(null); }}
      />

      {error && <ErrorState message={error} />}
      {success && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>}

      {projectId && loading && <LoadingSpinner />}

      {dash && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            <KpiCard label={dict.site.workersPresent} value={String(dash.totalPresentToday)} icon={Check} accent="green" />
            <KpiCard label={dict.site.workersAbsent} value={String(dash.totalAbsentToday)} icon={Users} accent="red" />
            <KpiCard label={dict.site.totalHours} value={`${Number(dash.totalHoursToday)}h`} icon={Clock} />
            <KpiCard label={dict.site.dailyCost} value={formatMAD(Number(dash.totalDailyCost))} icon={DollarSign} />
          </div>

          {/* Project totals */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-3">
                  <div className="text-xs text-muted-foreground">{dict.site.totalCost}</div>
                  <div className="text-lg font-bold">{formatMAD(Number(dash.totalProjectCost))}</div>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <div className="text-xs text-muted-foreground">{dict.site.totalHours}</div>
                  <div className="text-lg font-bold">{Number(dash.totalProjectHours)}h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {projectId && intervenants.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-base font-bold">{dict.site.markAttendance} - {new Date().toLocaleDateString("fr-FR")}</h2>
            <form onSubmit={handleBatchAttendance}>
              <div className="space-y-2">
                {intervenants.map((iv) => {
                  const marked = isAlreadyMarked(iv.id);
                  return (
                    <div key={iv.id} className={`rounded-xl border bg-card p-3 ${marked ? "opacity-60" : ""}`}>
                      <label className="flex cursor-pointer items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" data-present={iv.id} defaultChecked={marked} disabled={marked} className="size-5 rounded border-gray-300 text-primary focus:ring-primary" />
                          <div>
                            <p className="text-sm font-medium">{iv.name}</p>
                            <p className="text-xs text-muted-foreground">{iv.trade || ""}</p>
                          </div>
                        </div>
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-2 pl-8">
                        <div>
                          <label className="text-xs text-muted-foreground">{dict.site.hoursWorked}</label>
                          <input data-hours={iv.id} type="number" step="0.5" min="0" max="24" defaultValue="8" disabled={marked} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">{dict.site.dailyCost} ({dict.financial.MAD})</label>
                          <input data-cost={iv.id} type="number" step="50" min="0" defaultValue="0" disabled={marked} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <Button type="submit" disabled={saving} size="lg" className="w-full sm:w-auto">
                  {saving ? dict.actions.saving : `${dict.site.markAttendance} (${intervenants.length})`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {dash && dash.presentToday.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-base font-bold">{dict.site.present} ({dash.totalPresentToday})</h2>
            {dash.presentToday.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl bg-muted p-3">
                <div>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.trade || ""}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {editingId === w.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.5" className="w-16 rounded border bg-background px-2 py-1 text-xs" value={editValues.hoursWorked} onChange={(e) => setEditValues({ ...editValues, hoursWorked: e.target.value })} />
                      <input type="number" step="50" className="w-20 rounded border bg-background px-2 py-1 text-xs" value={editValues.dailyCost} onChange={(e) => setEditValues({ ...editValues, dailyCost: e.target.value })} />
                          <Button size="sm" variant="default" className="h-7" onClick={() => handleEditAttendance(w.id)}><Check className="size-3" /></Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400"><Check className="size-4" /></span>
                      {w.hoursWorked > 0 && <span className="text-muted-foreground">{Number(w.hoursWorked)}h</span>}
                      {w.dailyCost > 0 && <span className="font-medium">{formatMAD(Number(w.dailyCost))}</span>}
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => startEdit(w.id, w.hoursWorked, w.dailyCost)}><Pencil className="size-3" /></Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
