"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatMAD } from "@/lib/format";
import type { Property } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink, DetailCard, InfoItem } from "@/components/ui-kit/detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const typeLabel = (t: string) =>
  (({ APPARTEMENT: dict.properties.apartment, LOCAL_COMMERCIAL: dict.properties.commercialSpace, BUREAU: dict.properties.office, ENTREPOT: dict.properties.warehouse }) as Record<string, string>)[t] || t;

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Property>(`/real-estate/properties/${id}`).then(setProperty).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/real-estate/properties/${id}`);
      router.push("/properties");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;
  if (!property) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href="/properties" label={dict.properties.title} />
      <PageHeader
        title={property.reference}
        subtitle={<StatusBadge status={property.status} />}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href={`/properties/${id}/edit`}><Pencil className="size-4" />{dict.actions.edit}</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />{dict.actions.delete}</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DetailCard title={dict.labels.generalInfo}>
            <InfoItem label={dict.properties.reference} value={property.reference} />
            <InfoItem label={dict.properties.type} value={typeLabel(property.type)} />
            <InfoItem label={dict.properties.surface} value={`${Number(property.surface)} ${dict.units.m2}`} />
            <InfoItem label={dict.properties.price} value={formatMAD(Number(property.price))} />
            <InfoItem label={dict.properties.status} value={<StatusBadge status={property.status} />} />
            <InfoItem label={dict.labels.notes} value={property.notes} full />
          </DetailCard>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">{dict.properties.project}</CardTitle></CardHeader>
          <CardContent>
            {property.project ? (
              <Link href={`/projects/${property.project.id}`} className="font-medium text-primary hover:underline">{property.project.name}</Link>
            ) : (
              <p className="text-sm text-muted-foreground">{dict.labels.noData}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <DeleteModal open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleting} message={dict.labels.confirmDelete} />
    </div>
  );
}
