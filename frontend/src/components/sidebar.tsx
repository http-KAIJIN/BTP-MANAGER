"use client";

import Link from "next/link";
import { HardHat } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { dict } from "@/lib/dict";

/** Brand lockup reused by the desktop sidebar and the mobile drawer header. */
export function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
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

/** Fixed desktop sidebar (hidden on small screens; mobile uses the drawer in Topbar). */
export default function Sidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-e bg-sidebar lg:flex">
      <div className="border-b border-sidebar-border p-4">
        <SidebarBrand />
      </div>
      <SidebarNav />
    </aside>
  );
}
