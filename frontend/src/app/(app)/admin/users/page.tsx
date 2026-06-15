"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { User } from "@/lib/types";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { RowActions } from "@/components/ui-kit/list-controls";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get<User[]>("/users")
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const columns: Column<User>[] = [
    { key: "name", header: dict.admin.fullName, cell: (u) => <span className="font-medium text-foreground">{u.fullName}</span> },
    { key: "email", header: dict.admin.email, cell: (u) => u.email },
    { key: "phone", header: dict.admin.phone, cell: (u) => u.phone || "-" },
    { key: "role", header: dict.admin.role, cell: (u) => u.roles.map((r) => r.name).join(", ") || "-" },
    { key: "status", header: dict.admin.status, cell: (u) => <StatusBadge status={u.status} /> },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (u) => <RowActions editHref={`/admin/users/${u.id}/edit`} onDelete={() => setDeleteId(u.id)} />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowRight className="size-4" />
        {dict.admin.title}
      </Link>
      <PageHeader
        title={dict.admin.users}
        subtitle={`${users.length} ${dict.admin.users}`}
        actions={
          <Button asChild>
            <Link href="/admin/users/new"><Plus className="size-4" />{dict.admin.newUser}</Link>
          </Button>
        }
      />
      {error ? (
        <ErrorState message={error} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          rowKey={(u) => u.id}
          onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
          emptyText={dict.admin.noUsers}
        />
      )}
      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
