"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { User, Role } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, SelectField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: dict.status.active },
  { value: "INACTIVE", label: dict.status.inactive },
  { value: "BLOCKED", label: dict.status.blocked },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", status: "ACTIVE" });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([api.get<User>(`/users/${id}`), api.get<Role[]>("/roles")])
      .then(([user, allRoles]) => {
        setForm({ fullName: user.fullName, email: user.email, phone: user.phone || "", password: "", status: user.status });
        setSelectedRoles(user.roles.map((r) => r.code));
        setRoles(allRoles);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const toggleRole = (code: string) =>
    setSelectedRoles((prev) => (prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) { setError(dict.errors.required); return; }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { fullName: form.fullName, email: form.email, status: form.status, roleCodes: selectedRoles };
      if (form.phone) body.phone = form.phone;
      if (form.password) body.password = form.password;
      await api.patch(`/users/${id}`, body);
      router.push("/admin/users");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !form.fullName) return <div className="p-6 lg:p-8"><ErrorState message={error} /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.admin.editUser} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.admin.userDetail}>
          <TextField label={dict.admin.fullName} value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <TextField label={dict.admin.email} type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <TextField label={dict.admin.phone} value={form.phone} onChange={(v) => update("phone", v)} />
          <SelectField label={dict.admin.status} value={form.status} onChange={(v) => update("status", v)} options={STATUS_OPTIONS} />
          <TextField label={dict.admin.password} type="password" value={form.password} onChange={(v) => update("password", v)} hint={dict.labels.optional} />
        </FormSection>

        <FormSection title={dict.admin.roles} columns={1}>
          <div className="space-y-2">
            <Label>{dict.admin.role}</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((role) => (
                <label key={role.code} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50">
                  <input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={() => toggleRole(role.code)} className="size-4 accent-[var(--primary)]" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{role.name}</div>
                    {role.description && <div className="text-xs text-muted-foreground">{role.description}</div>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </FormSection>

        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.update} />
      </form>
    </div>
  );
}
