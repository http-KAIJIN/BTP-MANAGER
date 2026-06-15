"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { dict } from "@/lib/dict";
import type { Role } from "@/lib/types";
import LoadingSpinner from "@/components/loading-spinner";
import { PageHeader } from "@/components/ui-kit/page-header";
import { FormSection } from "@/components/ui-kit/form-section";
import { TextField, FormActions } from "@/components/ui-kit/form-fields";
import { ErrorState } from "@/components/ui-kit/error-state";
import { Label } from "@/components/ui/label";

export default function NewUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    api.get<Role[]>("/roles").then(setRoles).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const toggleRole = (code: string) =>
    setSelectedRoles((prev) => (prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password) { setError(dict.errors.required); return; }
    if (form.password.length < 8) { setError(dict.errors.minLength.replace("{min}", "8")); return; }
    if (form.password !== form.confirmPassword) { setError(dict.errors.validation); return; }
    if (selectedRoles.length === 0) { setError(dict.errors.validation); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/users", { fullName: form.fullName, email: form.email, phone: form.phone || undefined, password: form.password, roleCodes: selectedRoles });
      router.push("/admin/users");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : dict.errors.saveFailed);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.admin.newUser} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={dict.admin.userDetail}>
          <TextField label={dict.admin.fullName} value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <TextField label={dict.admin.email} type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <TextField label={dict.admin.phone} value={form.phone} onChange={(v) => update("phone", v)} />
          <div className="hidden sm:block" />
          <TextField label={dict.admin.password} type="password" value={form.password} onChange={(v) => update("password", v)} required hint={dict.errors.minLength.replace("{min}", "8")} />
          <TextField label={`${dict.actions.confirm} ${dict.admin.password}`} type="password" value={form.confirmPassword} onChange={(v) => update("confirmPassword", v)} required />
        </FormSection>

        <FormSection title={dict.admin.roles} columns={1}>
          <RoleChecklist roles={roles} selected={selectedRoles} onToggle={toggleRole} />
        </FormSection>

        {error && <ErrorState message={error} />}
        <FormActions saving={saving} saveLabel={dict.actions.create} />
      </form>
    </div>
  );
}

function RoleChecklist({ roles, selected, onToggle }: { roles: Role[]; selected: string[]; onToggle: (code: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{dict.admin.role}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {roles.map((role) => (
          <label key={role.code} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              checked={selected.includes(role.code)}
              onChange={() => onToggle(role.code)}
              className="size-4 accent-[var(--primary)]"
            />
            <div>
              <div className="text-sm font-medium text-foreground">{role.name}</div>
              {role.description && <div className="text-xs text-muted-foreground">{role.description}</div>}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
