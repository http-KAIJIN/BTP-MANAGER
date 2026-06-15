"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { navGroups, standaloneLabels, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function groupHasActive(group: NavGroup, pathname: string) {
  return group.items?.some((i) => isActive(i.href, pathname)) ?? false;
}

/**
 * Grouped, collapsible navigation shared by the desktop sidebar and the mobile drawer.
 * `onNavigate` lets the mobile drawer close itself on selection.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {navGroups.map((group, idx) => {
        // Standalone top-level link
        if (group.label === null && group.href) {
          const active = isActive(group.href, pathname);
          const Icon = group.icon;
          return (
            <Link
              key={group.href}
              href={group.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{standaloneLabels[group.href]}</span>
            </Link>
          );
        }
        return <NavCollapsibleGroup key={idx} group={group} pathname={pathname} onNavigate={onNavigate} />;
      })}
    </nav>
  );
}

function NavCollapsibleGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasActive = groupHasActive(group, pathname);
  const [open, setOpen] = useState(hasActive);
  const GroupIcon = group.icon;

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
          "text-sidebar-foreground/55 hover:text-sidebar-foreground",
        )}
      >
        <GroupIcon className="size-4 shrink-0" />
        <span className="flex-1 text-start">{group.label}</span>
        <ChevronDown
          className={cn("size-4 transition-transform duration-200", open ? "rotate-180" : "")}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-1 flex flex-col gap-0.5 ps-3">
            {group.items?.map((item) => {
              const active = isActive(item.href, pathname);
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <ItemIcon className="size-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
