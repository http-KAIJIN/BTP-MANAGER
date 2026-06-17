"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, LogOut, User as UserIcon, Settings, Globe, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarBrand } from "@/components/sidebar";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { dict } from "@/lib/dict";

const LANGUAGES = [
  { code: "ar", label: dict.language.ar },
  { code: "fr", label: dict.language.fr },
  { code: "en", label: dict.language.en },
];

function initials(name?: string) {
  if (!name) return <UserIcon className="size-4" />;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
}

function getCurrentLangLabel(userLang?: string) {
  const lang = LANGUAGES.find((l) => l.code === userLang);
  return lang ? lang.label : dict.language.ar;
}

export default function Topbar() {
  const { user, logout, updateLanguage } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      {/* Mobile drawer trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="القائمة">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 bg-sidebar p-0">
          <SheetHeader className="border-b border-sidebar-border p-4">
            <SheetTitle className="text-start">
              <SidebarBrand onNavigate={() => setOpen(false)} />
            </SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Brand on mobile (sidebar is hidden there) */}
      <div className="lg:hidden">
        <SidebarBrand />
      </div>

      <div className="flex-1" />

      <AnimatedThemeToggler />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 gap-2 px-2"
            aria-label={user?.fullName ?? dict.auth.login}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials(user?.fullName)}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
              {user?.fullName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{user?.fullName}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user?.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="size-4" />
              {dict.nav.settings}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Globe className="size-4" />
              <span>{getCurrentLangLabel(user?.preferredLanguage)}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => updateLanguage(lang.code)}
                  className={user?.preferredLanguage === lang.code ? "bg-accent font-semibold" : ""}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" />
            {dict.nav.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
