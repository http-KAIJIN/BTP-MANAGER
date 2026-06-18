"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarBrand, SidebarUserMenu } from "@/components/sidebar";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Topbar() {
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
            <SidebarUserMenu onNavigate={() => setOpen(false)} />
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
    </header>
  );
}
