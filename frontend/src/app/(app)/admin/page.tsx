"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ShieldCheck, KeyRound, ChevronLeft } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { User, Role, Permission } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/users"),
      api.get<Role[]>("/roles"),
      api.get<Permission[]>("/permissions"),
    ])
      .then(([u, r, p]) => { setUsers(u); setRoles(r); setPermissions(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { href: "/admin/users", label: dict.admin.users, value: users.length, icon: Users, accent: "blue" as const },
    { href: "/admin/roles", label: dict.admin.roles, value: roles.length, icon: ShieldCheck, accent: "orange" as const },
    { href: "/admin/permissions", label: dict.admin.permissions, value: permissions.length, icon: KeyRound, accent: "violet" as const },
  ];

  const columns: Column<User>[] = [
    { key: "name", header: dict.admin.fullName, cell: (u) => <span className="font-medium text-foreground">{u.fullName}</span> },
    { key: "email", header: dict.admin.email, cell: (u) => u.email },
    { key: "role", header: dict.admin.role, cell: (u) => u.roles.map((r) => r.name).join(", ") || "-" },
    { key: "status", header: dict.admin.status, cell: (u) => <StatusBadge status={u.status} /> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.admin.title} />
      {error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {cards.map((c) => (
              <Link key={c.href} href={c.href} className="group">
                <Card className="transition-shadow group-hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 p-5">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                      <p className="mt-1 text-2xl font-bold">{c.value}</p>
                    </div>
                    <span className={`flex size-11 items-center justify-center rounded-xl ${c.accent === "blue" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : c.accent === "orange" ? "bg-primary/10 text-primary" : "bg-violet-500/10 text-violet-600 dark:text-violet-400"}`}>
                      <c.icon className="size-5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{dict.admin.users}</h2>
              <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {dict.dashboard.viewAll}
                <ChevronLeft className="size-4" />
              </Link>
            </div>
            <DataTable columns={columns} data={users.slice(0, 5)} loading={loading} rowKey={(u) => u.id} onRowClick={(u) => router.push(`/admin/users/${u.id}`)} emptyText={dict.admin.noUsers} />
          </div>
        </>
      )}
    </div>
  );
}
