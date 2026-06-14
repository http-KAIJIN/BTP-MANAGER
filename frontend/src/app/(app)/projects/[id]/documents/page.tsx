'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import LoadingSpinner from '@/components/loading-spinner';
import DeleteModal from '@/components/delete-modal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  createdAt: string;
}

const CATEGORIES = [
  'Permis de construire', 'Plans', 'Contrats', 'Assurances',
  'Rapports techniques', 'Photos', 'Other',
];

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('Other');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = () => {
    setLoading(true);
    api.get<Document[]>(`/documents/projects/${projectId}`)
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, [projectId]);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `${API_BASE}/documents/projects/${projectId}/upload?category=${encodeURIComponent(category)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData },
      );
      if (!res.ok) throw new Error('Upload failed');
      if (fileRef.current) fileRef.current.value = '';
      fetchDocs();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Upload failed');
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
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
    setDeleting(false);
  };

  const downloadUrl = (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return `${API_BASE}/documents/${id}/download?token=${token}`;
  };

  if (error) return <div className="m-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="text-sm text-orange-600 hover:underline">&larr; Project</Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 mt-1">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">{docs.length} documents</p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Upload Document</h2>
        <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
            <input type="file" ref={fileRef} required
              className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" />
          </div>
          <button type="submit" disabled={uploading}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-900">{doc.originalName}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{doc.category}</span></td>
                  <td className="px-5 py-4 text-slate-600">{formatSize(doc.size)}</td>
                  <td className="px-5 py-4 text-slate-600">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <a href={downloadUrl(doc.id)} download
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Download</a>
                      <button onClick={() => setDeleteId(doc.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No documents uploaded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <DeleteModal open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
