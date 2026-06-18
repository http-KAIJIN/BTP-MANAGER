"use client";

import { Camera, KeyRound, ShieldCheck, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui-kit/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function initials(name?: string) {
  if (!name) return "U";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function splitName(fullName?: string) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { dict } = useI18n();
  const { firstName, lastName } = splitName(user?.fullName);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={dict.profile.title} subtitle={dict.profile.subtitle} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
          <CardContent className="-mt-12 space-y-4 p-6 text-center">
            <div className="mx-auto flex size-24 items-center justify-center rounded-3xl border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
              {initials(user?.fullName)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.fullName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" className="w-full" disabled><Camera className="size-4" />{dict.profile.photo}</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="size-5" />{dict.profile.userInfo}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info label={dict.profile.fullName} value={`${firstName} ${lastName}`.trim()} />
              <Info label={dict.profile.email} value={user?.email} />
              <Info label={dict.profile.phone} value={user?.phone ?? "-"} />
              <Info label={dict.profile.preferredLanguage} value={user?.preferredLanguage ?? "ar"} />
              <Info label={dict.profile.lastLogin} value={formatDate(user?.lastLoginAt)} />
            </CardContent>
          </Card>

          <Card id="account">
            <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5" />{dict.profile.passwordChange}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{dict.profile.passwordHelp}</p>
              <Button asChild variant="outline"><Link href="/settings/security">{dict.profile.passwordChange}</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />{dict.profile.accountSettings}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Info label={dict.profile.status} value={<Badge variant="outline">{user?.status ?? "ACTIVE"}</Badge>} />
              <Info label={dict.profile.roles} value={(user?.roles ?? []).map((role) => role.name).join(", ") || "-"} />
              <Info label={dict.profile.created} value={formatDate(user?.createdAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{value || "-"}</div>
    </div>
  );
}
