"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import type { User } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<User>(`/users/${id}`).then(setUser).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${id}`);
      router.push("/admin/users");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!user) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/admin/users" label={dict.admin.users} />
      <PageHeader
        title={user.fullName}
        subtitle={user.email}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/admin/users/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <DetailCard title={dict.labels.generalInfo}>
        <InfoItem label={dict.admin.fullName} value={user.fullName} />
        <InfoItem label={dict.admin.email} value={user.email} />
        <InfoItem label={dict.admin.phone} value={user.phone} />
        <InfoItem label={dict.admin.status} value={<StatusBadge status={user.status} />} />
        <InfoItem label={dict.labels.createdAt} value={formatDate(user.createdAt)} />
      </DetailCard>
      <Card>
        <CardHeader><CardTitle className="text-base font-bold">{dict.admin.roles}</CardTitle></CardHeader>
        <CardContent>
          {user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role.code} variant="secondary">{role.name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{dict.admin.noRoles}</p>
          )}
        </CardContent>
      </Card>
      <DeleteModal open={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
