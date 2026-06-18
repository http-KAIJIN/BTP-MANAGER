"use client";

import Link from "next/link";
import { ChevronDown, Globe, HardHat, Lock, LogOut, Settings, User as UserIcon } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name?: string) {
  if (!name) return <UserIcon className="size-4" />;
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

/** Brand lockup reused by the desktop sidebar and the mobile drawer header. */
export function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  const { dict } = useI18n();

  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 px-2 py-1"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <HardHat className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold leading-tight tracking-tight text-sidebar-foreground">
          {dict.appName}
        </span>
        <span className="block truncate text-xs text-sidebar-foreground/60">
          {dict.appSubtitle}
        </span>
      </span>
    </Link>
  );
}

export function SidebarUserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { dict } = useI18n();

  const itemClass = "flex items-center gap-2";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-2 text-start transition hover:bg-sidebar-accent">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            {initials(user?.fullName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">{user?.fullName}</span>
            <span className="block truncate text-xs text-sidebar-foreground/60">{user?.email}</span>
          </span>
          <ChevronDown className="size-4 text-sidebar-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{user?.fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" onClick={onNavigate} className={itemClass}><UserIcon className="size-4" />My Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/company" onClick={onNavigate} className={itemClass}><Settings className="size-4" />Company Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/languages" onClick={onNavigate} className={itemClass}><Globe className="size-4" />Language</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/security" onClick={onNavigate} className={itemClass}><Lock className="size-4" />Change Password</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          {dict.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Fixed desktop sidebar (hidden on small screens; mobile uses the drawer in Topbar). */
export default function Sidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-e bg-sidebar lg:flex">
      <div className="border-b border-sidebar-border p-4">
        <SidebarBrand />
        <SidebarUserMenu />
      </div>
      <SidebarNav />
    </aside>
  );
}
