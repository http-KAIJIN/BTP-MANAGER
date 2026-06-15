"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Permission } from "@/lib/types";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink } from "@/components/ui-kit/detail";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Permission[]>("/permissions").then(setPermissions).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const columns: Column<Permission>[] = [
    { key: "code", header: dict.admin.permissionCode, cell: (p) => <span className="font-mono text-xs font-medium text-foreground">{p.code}</span> },
    { key: "desc", header: dict.admin.permissionDescription, cell: (p) => p.description || "-" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/admin" label={dict.admin.title} />
      <PageHeader title={dict.admin.permissions} subtitle={`${permissions.length} ${dict.admin.permissions}`} />
      {error ? (
        <ErrorState message={error} />
      ) : (
        <DataTable columns={columns} data={permissions} loading={loading} rowKey={(p) => p.id} emptyText={dict.admin.noPermissions} />
      )}
    </div>
  );
}
