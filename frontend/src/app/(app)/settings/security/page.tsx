"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { FormActions, TextField } from "@/components/ui-kit/form-fields";

export default function SecuritySettingsPage() {
  const { dict } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage(dict.profile.passwordUpdated);
    } catch {
      setError(dict.profile.passwordUpdateFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.profile.passwordChange} subtitle={dict.profile.securitySubtitle} />
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{message}</div>}
      <form onSubmit={submit}>
        <FormSection title={dict.profile.passwordChange} columns={1}>
          <TextField label={dict.profile.currentPassword} value={currentPassword} onChange={setCurrentPassword} type="password" required />
          <TextField label={dict.profile.newPassword} value={newPassword} onChange={setNewPassword} type="password" required />
        </FormSection>
        <FormActions saving={saving} />
      </form>
    </div>
  );
}
