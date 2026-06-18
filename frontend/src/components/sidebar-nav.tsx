"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Star } from "lucide-react";
import { getNavGroups, getStandaloneLabels, type NavGroup, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const FAVORITES_KEY = "sidebar-favorites";

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function groupHasActive(group: NavGroup, pathname: string) {
  return group.items?.some((i) => isActive(i.href, pathname)) ?? false;
}

function getAllNavItems(navGroups: NavGroup[], standaloneLabels: Record<string, string>): NavItem[] {
  const items: NavItem[] = [];
  for (const g of navGroups) {
    if (g.href) {
      items.push({ label: standaloneLabels[g.href] || g.label || "", href: g.href, icon: g.icon });
    }
    if (g.items) items.push(...g.items);
  }
  return items;
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { dict } = useI18n();
  const navGroups = getNavGroups(dict);
  const standaloneLabels = getStandaloneLabels(dict);
  const [favorites, setFavorites] = useState<string[]>([]);
  const activeGroup = navGroups.find((group) => group.items && groupHasActive(group, pathname));
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup?.label ?? null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleFavorite = useCallback((href: string) => {
    setFavorites((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeGroup?.label) setOpenGroup(activeGroup.label);
  }, [activeGroup?.label]);

  const allItems = getAllNavItems(navGroups, standaloneLabels);
  const favoriteItems = allItems.filter((i) => favorites.includes(i.href));

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {favoriteItems.length > 0 && (
        <div className="mb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/55">
            <Star className="size-3.5" />
            <span>{dict.nav.favorites}</span>
          </div>
          <div className="mt-0.5 flex flex-col gap-0.5">
            {favoriteItems.map((item) => {
              const active = isActive(item.href, pathname);
              const Icon = item.icon;
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
                  <Icon className="size-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.href); }}
                    className="ms-auto shrink-0 text-sidebar-foreground/40 hover:text-yellow-500"
                    title="إزالة من المفضلة"
                  >
                    <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
                  </button>
                </Link>
              );
            })}
          </div>
          <div className="my-2 border-t border-sidebar-border" />
        </div>
      )}

      {navGroups.map((group, idx) => {
        // Standalone top-level link
        if (group.label === null && group.href) {
          const active = isActive(group.href, pathname);
          const Icon = group.icon;
          return (
            <div key={group.href} className="group flex items-center">
              <Link
                href={group.href}
                onClick={onNavigate}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="truncate">{standaloneLabels[group.href]}</span>
              </Link>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleFavorite(group.href!); }}
                className="me-1 shrink-0 p-1 text-sidebar-foreground/30 opacity-0 transition-opacity hover:text-yellow-500 group-hover:opacity-100"
                title={favorites.includes(group.href!) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              >
                <Star className={cn("size-3.5", favorites.includes(group.href!) && "fill-yellow-500 text-yellow-500 opacity-100")} />
              </button>
            </div>
          );
        }
        return (
          <NavCollapsibleGroup
            key={idx}
            group={group}
            pathname={pathname}
            onNavigate={onNavigate}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            open={openGroup === group.label}
            onOpenChange={() => setOpenGroup((current) => current === group.label ? null : group.label)}
          />
        );
      })}
    </nav>
  );
}

function NavCollapsibleGroup({
  group,
  pathname,
  onNavigate,
  favorites,
  onToggleFavorite,
  open,
  onOpenChange,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
  favorites: string[];
  onToggleFavorite: (href: string) => void;
  open: boolean;
  onOpenChange: () => void;
}) {
  const GroupIcon = group.icon;

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onOpenChange}
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
                <div key={item.href} className="group flex items-center">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <ItemIcon className="size-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.href); }}
                    className="me-1 shrink-0 p-1 text-sidebar-foreground/30 opacity-0 transition-opacity hover:text-yellow-500 group-hover:opacity-100"
                    title={favorites.includes(item.href) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                  >
                    <Star className={cn("size-3.5", favorites.includes(item.href) && "fill-yellow-500 text-yellow-500 opacity-100")} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
