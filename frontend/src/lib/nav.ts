import {
  LayoutDashboard,
  Building2,
  Wallet,
  FileSignature,
  BanknoteArrowUp,
  ReceiptText,
  FileBarChart,
  Users,
  Briefcase,
  UserCog,
  UsersRound,
  Home,
  Tag,
  HardHat,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { dict } from "@/lib/dict";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Group heading. `null` = ungrouped top-level link (no header, not collapsible). */
  label: string | null;
  icon: LucideIcon;
  /** A single destination for a standalone group (e.g. dashboard, projects, admin). */
  href?: string;
  items?: NavItem[];
}

/**
 * Grouped sidebar navigation, matching the Phase 7 brief.
 * Shared by both the desktop Sidebar and the mobile Sheet in Topbar.
 *
 * Note: documents live inside each project, so they are reached via the
 * Project Workspace "الوثائق" tab rather than a global sidebar entry.
 */
export const navGroups: NavGroup[] = [
  { label: null, icon: LayoutDashboard, href: "/" },
  { label: null, icon: Building2, href: "/projects" },
  {
    label: "المالية",
    icon: Wallet,
    items: [
      { label: dict.nav.commitments, href: "/commitments", icon: FileSignature },
      { label: dict.nav.payments, href: "/payments", icon: BanknoteArrowUp },
      { label: dict.nav.expenses, href: "/expenses", icon: ReceiptText },
      { label: dict.nav.reports, href: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "العلاقات",
    icon: Users,
    items: [
      { label: dict.nav.companies, href: "/companies", icon: Briefcase },
      { label: dict.nav.suppliers, href: "/suppliers", icon: UserCog },
      { label: dict.nav.intervenants, href: "/intervenants", icon: UsersRound },
      { label: dict.nav.clients, href: "/clients", icon: Users },
    ],
  },
  {
    label: "العقارات",
    icon: Home,
    items: [
      { label: dict.nav.properties, href: "/properties", icon: Home },
      { label: dict.nav.sales, href: "/sales", icon: Tag },
    ],
  },
  {
    label: "الورش",
    icon: HardHat,
    items: [
      { label: dict.nav.construction, href: "/construction", icon: HardHat },
    ],
  },
  { label: null, icon: Settings, href: "/admin" },
];

/** Flat label lookup for standalone groups, keyed by href. */
export const standaloneLabels: Record<string, string> = {
  "/": dict.nav.dashboard,
  "/projects": dict.nav.projects,
  "/admin": dict.nav.admin,
};
