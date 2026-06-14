'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Project, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

interface ProjectProgress {
  projectId: string;
  globalProgress: number;
}

export default function ConstructionPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PaginatedResponse<Project>>('/projects?limit=100')
      .then(async (res) => {
        setProjects(res.data);
        const promises = res.data.map(async (p) => {
          try {
            const prog = await api.get<ProjectProgress>(`/construction/projects/${p.id}/progress`);
            return { id: p.id, progress: prog.globalProgress };
          } catch {
            return { id: p.id, progress: 0 };
          }
        });
        const results = await Promise.all(promises);
        const map: Record<string, number> = {};
        results.forEach((r) => { map[r.id] = r.progress; });
        setProgressMap(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading construction tracking..." />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-2">Construction Tracking</h1>
      <p className="text-sm text-slate-500 mb-8">Track progress across all construction projects</p>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No projects yet. <Link href="/projects/new" className="text-orange-600 hover:underline">Create a project</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const progress = progressMap[p.id] ?? 0;
            return (
              <Link
                key={p.id}
                href={`/construction/${p.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 transition-colors"
              >
                <div className="text-lg font-bold text-slate-900">{p.name}</div>
                <div className="text-sm text-slate-500">{p.city}</div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">Global progress</span>
                    <span className="font-semibold text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-orange-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">{p.status}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
