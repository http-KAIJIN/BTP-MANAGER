import {
  LayoutDashboard,
  Building2,
  Wallet,
  FileSignature,
  BanknoteArrowUp,
  ReceiptText,
  FileBarChart,
  BarChart3,
  BookOpen,
  TrendingUp,
  Users,
  Briefcase,
  UserCog,
  UsersRound,
  Home,
  Tag,
  HardHat,
  ClipboardList,
  Package,
  Settings,
  Cog,
  ShoppingCart,
  Truck,
  Warehouse,
  ScanLine,
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
      { label: dict.nav.quotes, href: "/quotes", icon: FileSignature },
      { label: dict.nav.invoices, href: "/invoices", icon: ReceiptText },
      { label: dict.nav.financeDashboard, href: "/finance", icon: BarChart3 },
      { label: dict.nav.journal, href: "/finance/journal", icon: BookOpen },
      { label: dict.nav.cashFlow, href: "/finance/cash-flow", icon: TrendingUp },
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
      { label: dict.nav.siteJournal, href: "/construction/site-journal", icon: ClipboardList },
      { label: dict.nav.materials, href: "/construction/materials", icon: Package },
    ],
  },
  {
    label: "المشتريات",
    icon: ShoppingCart,
    items: [
      { label: dict.nav.purchaseOrders, href: "/purchase-orders", icon: FileSignature },
      { label: dict.nav.goodsReceipts, href: "/goods-receipts", icon: Truck },
    ],
  },
  {
    label: "المخزون",
    icon: Warehouse,
    items: [
      { label: dict.nav.stock, href: "/stock", icon: Package },
      { label: dict.nav.stockMovements, href: "/stock/movements", icon: TrendingUp },
    ],
  },
  { label: null, icon: Settings, href: "/admin" },
  { label: null, icon: ScanLine, href: "/ocr" },
];

/** Flat label lookup for standalone groups, keyed by href. */
export const standaloneLabels: Record<string, string> = {
  "/": dict.nav.dashboard,
  "/projects": dict.nav.projects,
  "/admin": dict.nav.admin,
  "/ocr": dict.nav.ocr,
};

export function getNavGroups(d: typeof dict): NavGroup[] {
  return [
    { label: null, icon: LayoutDashboard, href: "/" },
    { label: null, icon: Building2, href: "/projects" },
    {
      label: d.finance.title,
      icon: Wallet,
      items: [
        { label: d.nav.commitments, href: "/commitments", icon: FileSignature },
        { label: d.nav.payments, href: "/payments", icon: BanknoteArrowUp },
        { label: d.nav.expenses, href: "/expenses", icon: ReceiptText },
        { label: d.nav.reports, href: "/reports", icon: FileBarChart },
        { label: d.nav.quotes, href: "/quotes", icon: FileSignature },
        { label: d.nav.invoices, href: "/invoices", icon: ReceiptText },
        { label: d.nav.financeDashboard, href: "/finance", icon: BarChart3 },
        { label: d.nav.journal, href: "/finance/journal", icon: BookOpen },
        { label: d.nav.cashFlow, href: "/finance/cash-flow", icon: TrendingUp },
      ],
    },
    {
      label: d.nav.companies,
      icon: Users,
      items: [
        { label: d.nav.companies, href: "/companies", icon: Briefcase },
        { label: d.nav.suppliers, href: "/suppliers", icon: UserCog },
        { label: d.nav.intervenants, href: "/intervenants", icon: UsersRound },
        { label: d.nav.clients, href: "/clients", icon: Users },
      ],
    },
    {
      label: d.nav.construction,
      icon: HardHat,
      items: [
        { label: d.nav.construction, href: "/construction", icon: HardHat },
        { label: d.nav.siteJournal, href: "/construction/site-journal", icon: ClipboardList },
        { label: d.nav.materials, href: "/construction/materials", icon: Package },
      ],
    },
    {
      label: d.nav.properties,
      icon: Home,
      items: [
        { label: d.nav.properties, href: "/properties", icon: Home },
        { label: d.nav.sales, href: "/sales", icon: Tag },
      ],
    },
    {
      label: d.purchaseOrders.title,
      icon: ShoppingCart,
      items: [
        { label: d.nav.purchaseOrders, href: "/purchase-orders", icon: FileSignature },
        { label: d.nav.goodsReceipts, href: "/goods-receipts", icon: Truck },
      ],
    },
    {
      label: d.stock.title,
      icon: Warehouse,
      items: [
        { label: d.nav.stock, href: "/stock", icon: Package },
        { label: d.nav.stockMovements, href: "/stock/movements", icon: TrendingUp },
      ],
    },
    { label: null, icon: Settings, href: "/admin" },
    { label: null, icon: ScanLine, href: "/ocr" },
  ];
}

export function getStandaloneLabels(d: typeof dict): Record<string, string> {
  return { "/": d.nav.dashboard, "/projects": d.nav.projects, "/admin": d.nav.admin, "/ocr": d.nav.ocr };
}
