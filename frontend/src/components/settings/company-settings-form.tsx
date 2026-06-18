"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, FileText, Image, Landmark, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { FormActions, TextareaField, TextField } from "@/components/ui-kit/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  defaultNotes?: string;
  accountInfo?: string;
  logoPath: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

function emptyProfile(): CompanyProfile {
  return { companyName: "", ice: "", ifTax: "", rc: "", cnss: "", address: "", phone: "", email: "", website: "", bankName: "", bankRib: "", defaultTvaRate: 20, defaultPaymentTerms: "", defaultDocumentFooter: "", defaultNotes: "", accountInfo: "", logoPath: null };
}

export function CompanySettingsForm({ initialTab = "company" }: { initialTab?: string }) {
  const { dict } = useI18n();
  const [profile, setProfile] = useState<CompanyProfile>(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<CompanyProfile | null>("/settings/profile");
      setProfile(data ? { ...emptyProfile(), ...data } : emptyProfile());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const update = (field: keyof CompanyProfile, value: string | number) => setProfile((current) => ({ ...current, [field]: value }));

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.upload("/settings/logo", formData);
      await fetchProfile();
      setSuccess(dict.settings.saveSuccess);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = async () => {
    setError("");
    try {
      await api.delete("/settings/logo");
      await fetchProfile();
      setSuccess(dict.settings.saveSuccess);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const logoUrl = profile.logoPath ? `${API}/settings/logo/file?t=${encodeURIComponent(profile.logoPath)}` : null;

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Company Settings" subtitle="Central source for company identity, branding, document defaults, and banking details." />
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{success}</div>}

      <form onSubmit={save}>
        <Tabs defaultValue={initialTab} className="gap-6">
          <TabsList className="h-auto w-full flex-wrap justify-start bg-card p-2 shadow-sm">
            <TabsTrigger value="company" className="px-3 py-2"><Building2 className="size-4" />Company Information</TabsTrigger>
            <TabsTrigger value="branding" className="px-3 py-2"><Image className="size-4" />Branding</TabsTrigger>
            <TabsTrigger value="documents" className="px-3 py-2"><FileText className="size-4" />Documents</TabsTrigger>
            <TabsTrigger value="bank" className="px-3 py-2"><Landmark className="size-4" />Bank Information</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <FormSection title="Company Information" columns={2}>
              <TextField label={dict.settings.companyName} value={profile.companyName} onChange={(v) => update("companyName", v)} required />
              <TextField label={dict.settings.ice} value={profile.ice} onChange={(v) => update("ice", v)} />
              <TextField label={dict.settings.ifTax} value={profile.ifTax} onChange={(v) => update("ifTax", v)} />
              <TextField label={dict.settings.rc} value={profile.rc} onChange={(v) => update("rc", v)} />
              <TextField label={dict.settings.cnss} value={profile.cnss} onChange={(v) => update("cnss", v)} />
              <TextField label={dict.settings.phone} value={profile.phone} onChange={(v) => update("phone", v)} />
              <TextField label={dict.settings.email} value={profile.email} onChange={(v) => update("email", v)} type="email" />
              <TextField label={dict.settings.website} value={profile.website} onChange={(v) => update("website", v)} />
              <TextareaField label={dict.settings.address} value={profile.address} onChange={(v) => update("address", v)} rows={3} full />
            </FormSection>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-[180px_1fr]">
                  <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                    {logoUrl ? <img src={logoUrl} alt="Company logo" className="max-h-full max-w-full object-contain" /> : <Image className="size-12 text-muted-foreground/50" />}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Logo preview</h3>
                      <p className="text-sm text-muted-foreground">Used automatically in quotes, invoices, purchase orders, and future reports.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" disabled={logoUploading} className="relative overflow-hidden">
                        <Upload className="size-4" />{logoUploading ? dict.actions.uploading : "Replace logo"}
                        <input type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp" onChange={uploadLogo} className="absolute inset-0 cursor-pointer opacity-0" disabled={logoUploading} />
                      </Button>
                      {logoUrl && <Button type="button" variant="outline" onClick={removeLogo} className="text-destructive"><Trash2 className="size-4" />Delete logo</Button>}
                    </div>
                    <p className="text-xs text-muted-foreground">{dict.settings.logoHint}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <FormSection title="Documents" columns={2}>
              <TextField label={dict.settings.defaultTvaRate} value={String(profile.defaultTvaRate)} onChange={(v) => update("defaultTvaRate", Number(v) || 0)} type="number" />
              <TextareaField label={dict.settings.defaultPaymentTerms} value={profile.defaultPaymentTerms} onChange={(v) => update("defaultPaymentTerms", v)} rows={3} />
              <TextareaField label="Footer text" value={profile.defaultDocumentFooter} onChange={(v) => update("defaultDocumentFooter", v)} rows={3} />
              <TextareaField label="Default notes" value={profile.defaultNotes ?? ""} onChange={(v) => update("defaultNotes", v)} rows={3} />
            </FormSection>
          </TabsContent>

          <TabsContent value="bank">
            <FormSection title="Bank Information" columns={2}>
              <TextField label={dict.settings.bankName} value={profile.bankName} onChange={(v) => update("bankName", v)} />
              <TextField label={dict.settings.bankRib} value={profile.bankRib} onChange={(v) => update("bankRib", v)} />
              <TextareaField label="Account information" value={profile.accountInfo ?? ""} onChange={(v) => update("accountInfo", v)} rows={4} full />
            </FormSection>
          </TabsContent>
        </Tabs>
        <FormActions saving={saving} />
      </form>
    </div>
  );
}
