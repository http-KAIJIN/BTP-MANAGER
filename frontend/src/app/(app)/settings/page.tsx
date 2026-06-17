"use client";

import { useEffect, useState, useCallback } from "react";
import { Image, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, TextareaField, FormActions } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui-kit/error-state";

interface CompanyProfile {
  companyName: string;
  ice: string;
  ifTax: string;
  rc: string;
  cnss: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bankRib: string;
  defaultTvaRate: number;
  defaultPaymentTerms: string;
  defaultDocumentFooter: string;
  logoPath: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export default function SettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<CompanyProfile | null>("/settings/profile");
      if (data) {
        setProfile(data);
      } else {
        setProfile({
          companyName: "",
          ice: "",
          ifTax: "",
          rc: "",
          cnss: "",
          address: "",
          phone: "",
          email: "",
          website: "",
          bankName: "",
          bankRib: "",
          defaultTvaRate: 20,
          defaultPaymentTerms: "",
          defaultDocumentFooter: "",
          logoPath: null,
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Build logo URL
  useEffect(() => {
    if (profile?.logoPath) {
      setLogoUrl(`${API}/settings/logo/file?t=${Date.now()}`);
    } else {
      setLogoUrl(null);
    }
  }, [profile?.logoPath]);

  const update = (field: keyof CompanyProfile, value: string | number) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/settings/profile", profile);
      setSuccess(dict.settings.saveSuccess);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/settings/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).message || "Upload failed");
      await fetchProfile();
      setSuccess(dict.settings.saveSuccess);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setError("");
    setSuccess("");
    try {
      await api.delete("/settings/logo");
      setLogoUrl(null);
      await fetchProfile();
      setSuccess(dict.settings.saveSuccess);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader title={dict.settings.title} />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader title={dict.settings.title} />
        <ErrorState message={error || dict.errors.generic} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.settings.title} />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Company Info */}
        <FormSection title={dict.settings.companyProfile} columns={2}>
          <TextField
            label={dict.settings.companyName}
            value={profile.companyName}
            onChange={(v) => update("companyName", v)}
            required
          />
          <TextField label={dict.settings.ice} value={profile.ice} onChange={(v) => update("ice", v)} />
          <TextField label={dict.settings.ifTax} value={profile.ifTax} onChange={(v) => update("ifTax", v)} />
          <TextField label={dict.settings.rc} value={profile.rc} onChange={(v) => update("rc", v)} />
          <TextField label={dict.settings.cnss} value={profile.cnss} onChange={(v) => update("cnss", v)} />
          <TextField label={dict.settings.phone} value={profile.phone} onChange={(v) => update("phone", v)} />
          <TextField label={dict.settings.email} value={profile.email} onChange={(v) => update("email", v)} type="email" />
          <TextField label={dict.settings.website} value={profile.website} onChange={(v) => update("website", v)} />
          <TextareaField
            label={dict.settings.address}
            value={profile.address}
            onChange={(v) => update("address", v)}
            rows={2}
          />
        </FormSection>

        {/* Banking & Financial */}
        <FormSection title="معلومات بنكية" columns={2}>
          <TextField label={dict.settings.bankName} value={profile.bankName} onChange={(v) => update("bankName", v)} />
          <TextField label={dict.settings.bankRib} value={profile.bankRib} onChange={(v) => update("bankRib", v)} />
          <TextField
            label={dict.settings.defaultTvaRate}
            value={String(profile.defaultTvaRate)}
            onChange={(v) => update("defaultTvaRate", Number(v) || 0)}
            type="number"
          />
          <TextareaField
            label={dict.settings.defaultPaymentTerms}
            value={profile.defaultPaymentTerms}
            onChange={(v) => update("defaultPaymentTerms", v)}
            rows={2}
          />
          <TextareaField
            label={dict.settings.defaultDocumentFooter}
            value={profile.defaultDocumentFooter}
            onChange={(v) => update("defaultDocumentFooter", v)}
            rows={3}
            full
          />
        </FormSection>

        <FormActions saving={saving} />
      </form>

      {/* Logo Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-base font-bold">{dict.settings.logo}</h3>
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex size-32 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <Image className="size-10 text-muted-foreground/50" />
              )}
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Button type="button" variant="outline" disabled={logoUploading} className="relative">
                  <Upload className="size-4" />
                  {logoUploading ? dict.actions.uploading : dict.settings.uploadLogo}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={logoUploading}
                  />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{dict.settings.logoHint}</p>
              {logoUrl && (
                <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo} className="text-destructive">
                  <Trash2 className="size-4" />
                  {dict.settings.removeLogo}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
