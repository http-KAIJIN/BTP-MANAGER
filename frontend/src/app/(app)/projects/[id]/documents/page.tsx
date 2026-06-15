"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Download, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { formatDate } from "@/lib/format";
import DeleteModal from "@/components/delete-modal";
import { PageHeader } from "@/components/ui-kit/page-header";
import { ErrorState } from "@/components/ui-kit/error-state";
import { BackLink } from "@/components/ui-kit/detail";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101/api/v1";
const CATEGORIES = Object.values(dict.documents.categories) as string[];

interface ProjectDocument {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " " + dict.units.kb;
  return (bytes / (1024 * 1024)).toFixed(1) + " " + dict.units.mb;
}

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0] ?? "Other");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = () => {
    setLoading(true);
    api.get<ProjectDocument[]>(`/documents/projects/${projectId}`).then(setDocs).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, [projectId]);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/documents/projects/${projectId}/upload?category=${encodeURIComponent(category)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(dict.errors.saveFailed);
      if (fileRef.current) fileRef.current.value = "";
      fetchDocs();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteId}`);
      setDeleteId(null);
      fetchDocs();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : dict.errors.deleteFailed);
    }
    setDeleting(false);
  };

  const downloadUrl = (docId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
    return `${API_BASE}/documents/${docId}/download?token=${token}`;
  };

  const columns: Column<ProjectDocument>[] = [
    { key: "name", header: dict.documents.name, cell: (d) => <span className="font-medium text-foreground">{d.originalName}</span> },
    { key: "cat", header: dict.documents.category, cell: (d) => <Badge variant="secondary">{d.category}</Badge> },
    { key: "size", header: dict.documents.size, cell: (d) => formatSize(d.size) },
    { key: "date", header: dict.labels.date, cell: (d) => formatDate(d.createdAt) },
    {
      key: "actions",
      header: dict.labels.actions,
      headerClassName: "text-end",
      className: "text-end",
      cell: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild variant="outline" size="sm" className="h-8">
            <a href={downloadUrl(d.id)} download><Download className="size-3.5" />{dict.documents.download}</a>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)}>
            <Trash2 className="size-3.5" />{dict.documents.delete}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <BackLink href={`/projects/${projectId}`} label={dict.actions.back} />
      <PageHeader title={dict.documents.title} subtitle={`${docs.length} ${dict.documents.title}`} />

      <Card>
        <CardHeader><CardTitle className="text-base font-bold">{dict.documents.upload}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>{dict.documents.category}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{dict.documents.uploadNew}</Label>
              <Input type="file" ref={fileRef} required className="w-full sm:w-72" />
            </div>
            <Button type="submit" disabled={uploading}>
              <Upload className="size-4" />
              {uploading ? dict.documents.uploading : dict.documents.upload}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState message={error} />
      ) : (
        <DataTable columns={columns} data={docs} loading={loading} rowKey={(d) => d.id} emptyText={dict.documents.noDocuments} />
      )}

      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
