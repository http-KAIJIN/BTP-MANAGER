"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { FormActions, TextField } from "@/components/ui-kit/form-fields";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated. Please sign in again on other devices.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Security" subtitle="Manage password and account access." />
      {message && <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{message}</div>}
      <form onSubmit={submit}>
        <FormSection title="Change Password" columns={1}>
          <TextField label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" required />
          <TextField label="New password" value={newPassword} onChange={setNewPassword} type="password" required />
        </FormSection>
        <FormActions saving={saving} />
      </form>
    </div>
  );
}
