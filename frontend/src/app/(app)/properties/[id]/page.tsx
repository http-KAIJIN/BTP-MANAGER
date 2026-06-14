'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Property } from '@/lib/types';
import LoadingSpinner from '@/components/loading-spinner';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Property>(`/real-estate/properties/${id}`)
      .then(setProperty)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (!property) return null;

  const typeLabel = (t: string) => ({ APPARTEMENT: 'Apartment', LOCAL_COMMERCIAL: 'Local Commercial', BUREAU: 'Office', ENTREPOT: 'Warehouse' })[t] || t;
  const statusBadge = (s: string) => {
    const m: Record<string, string> = { DISPONIBLE: 'bg-green-100 text-green-700', RESERVE: 'bg-yellow-100 text-yellow-700', VENDU: 'bg-blue-100 text-blue-700' };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m[s] || 'bg-slate-100 text-slate-700'}`}>{s}</span>;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{property.reference}</h1>
          <p className="mt-1 text-sm text-slate-500">Property details</p>
        </div>
        <Link href={`/properties/${id}/edit`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Edit</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">General Info</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Reference</dt><dd className="font-medium">{property.reference}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd className="font-medium">{typeLabel(property.type)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Surface</dt><dd className="font-medium">{Number(property.surface)} m²</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Price</dt><dd className="font-medium">{Number(property.price).toLocaleString()} MAD</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd>{statusBadge(property.status)}</dd></div>
            {property.notes && <div className="flex justify-between"><dt className="text-slate-500">Notes</dt><dd className="font-medium">{property.notes}</dd></div>}
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Project</h2>
          {property.project ? (
            <Link href={`/projects/${property.project.id}`} className="text-orange-600 hover:underline">{property.project.name}</Link>
          ) : <p className="text-sm text-slate-500">No project linked</p>}
        </div>
      </div>
    </div>
  );
}
