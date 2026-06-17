"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Users, Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Project, Intervenant, AttendanceDashboard } from "@/lib/types";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get<{ data: Project[] }>("/projects", { limit: "200" })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) { setDash(null); setIntervenants([]); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    Promise.all([
      api.get<AttendanceDashboard>("/construction/attendance/dashboard", { projectId }),
      api.get<{ data: Intervenant[] }>("/intervenants", { limit: "200" }),
    ])
      .then(([d, iv]) => { setDash(d); setIntervenants(iv.data); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

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
        return {
          intervenantId: iv.id,
          isPresent: el?.checked ?? false,
          hoursWorked: el?.checked ? 8 : 0,
        };
      });
      await api.post(`/construction/attendance/batch`, { projectId, date, records });
      setSuccess(dict.labels.success);
      // reload dashboard
      const d = await api.get<AttendanceDashboard>("/construction/attendance/dashboard", { projectId });
      setDash(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <KpiCard label={dict.site.workersPresent} value={String(dash.totalPresentToday)} icon={Check} accent="green" />
          <KpiCard label={dict.site.workersAbsent} value={String(dash.totalAbsentToday)} icon={Users} accent="red" />
          <KpiCard label={dict.site.totalHours} value={`${Number(dash.totalHoursToday)}h`} icon={Clock} />
          <KpiCard label={dict.site.dailyCost} value={formatMAD(Number(dash.totalDailyCost))} icon={DollarSign} />
        </div>
      )}

      {projectId && intervenants.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-base font-bold">{dict.site.markAttendance}</h2>
            <form onSubmit={handleBatchAttendance}>
              <div className="space-y-2">
                {intervenants.map((iv) => (
                  <label key={iv.id} className="flex items-center justify-between rounded-xl border bg-card p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" data-present={iv.id} defaultChecked className="size-5 rounded border-gray-300 text-primary focus:ring-primary" />
                      <div>
                        <p className="text-sm font-medium">{iv.name}</p>
                        <p className="text-xs text-muted-foreground">{iv.trade || ""}</p>
                      </div>
                    </div>
                  </label>
                ))}
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
                  <span className="text-emerald-600 dark:text-emerald-400"><Check className="size-4" /></span>
                  {w.hoursWorked && <span className="text-muted-foreground">{Number(w.hoursWorked)}h</span>}
                  {w.dailyCost && <span className="font-medium">{formatMAD(Number(w.dailyCost))}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
