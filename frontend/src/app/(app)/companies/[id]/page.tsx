"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Company } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Company>(`/companies/${id}`).then(setCompany).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/companies/${id}`);
      router.push("/companies");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!company) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/companies" label={dict.companies.title} />
      <PageHeader
        title={company.name}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/companies/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <DetailCard title={dict.companies.detail}>
        <InfoItem label={dict.companies.ICE} value={company.ice} />
        <InfoItem label={dict.companies.phone} value={company.phone} />
        <InfoItem label={dict.companies.email} value={company.email} />
        <InfoItem label={dict.companies.address} value={company.address} />
        <InfoItem label={dict.companies.managerName} value={company.managerName} />
        <InfoItem label={dict.companies.status} value={<StatusBadge status={company.status} />} />
        <InfoItem label={dict.companies.notes} value={company.notes} full />
      </DetailCard>
      <DeleteModal open={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
