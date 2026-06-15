"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Role } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink } from "@/components/ui-kit/detail";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Role[]>("/roles").then(setRoles).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const columns: Column<Role>[] = [
    { key: "name", header: dict.labels.name, cell: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "code", header: dict.admin.roleCode, cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "desc", header: dict.admin.roleDescription, cell: (r) => r.description || "-" },
    { key: "perms", header: dict.admin.permissions, cell: (r) => `${r.rolePermissions.length} ${dict.admin.permissions}` },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/admin" label={dict.admin.title} />
      <PageHeader title={dict.admin.roles} subtitle={`${roles.length} ${dict.admin.roles}`} />
      {error ? (
        <ErrorState message={error} />
      ) : (
        <DataTable columns={columns} data={roles} loading={loading} rowKey={(r) => r.id} emptyText={dict.admin.noRoles} />
      )}
    </div>
  );
}
