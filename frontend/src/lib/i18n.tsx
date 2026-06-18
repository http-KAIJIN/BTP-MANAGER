"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { dict as arDict } from "@/lib/dict";

type Dict = typeof arDict;
type Lang = "ar" | "fr" | "en";

const fr: Partial<Dict> = {
  appSubtitle: "Gestion professionnelle BTP",
  nav: { ...arDict.nav, dashboard: "Tableau de bord", companies: "Entreprises", clients: "Clients", properties: "Biens immobiliers", sales: "Ventes", projects: "Projets", construction: "Chantier", siteJournal: "Journal de chantier", attendance: "Présence", materials: "Matériaux", sitePhotos: "Photos", suppliers: "Fournisseurs", intervenants: "Intervenants", commitments: "Engagements", payments: "Paiements", expenses: "Dépenses", quotes: "Devis", invoices: "Factures", financeDashboard: "Finance", journal: "Journal", cashFlow: "Trésorerie", reports: "Rapports", admin: "Administration", settings: "Paramètres", favorites: "Favoris", profile: "Mon profil", purchaseOrders: "Bons de commande", goodsReceipts: "Réceptions", stock: "Stock", stockMovements: "Mouvements de stock", ocr: "OCR intelligent", logout: "Déconnexion" },
  actions: { ...arDict.actions, new: "Nouveau", create: "Créer", save: "Enregistrer", edit: "Modifier", update: "Mettre à jour", delete: "Supprimer", cancel: "Annuler", close: "Fermer", search: "Rechercher", filter: "Filtrer", upload: "Importer", download: "Télécharger", view: "Voir", saving: "Enregistrement...", loading: "Chargement...", uploading: "Import..." },
  labels: { ...arDict.labels, name: "Nom", email: "Email", phone: "Téléphone", address: "Adresse", notes: "Notes", description: "Description", date: "Date", status: "Statut", type: "Type", category: "Catégorie", noData: "Aucune donnée", noResults: "Aucun résultat", success: "Opération réussie" },
  auth: { ...arDict.auth, logout: "Déconnexion", changePassword: "Changer le mot de passe" },
  dashboard: { ...arDict.dashboard, title: "Tableau de bord", totalProjects: "Total projets", totalSuppliers: "Total fournisseurs", totalIntervenants: "Total intervenants", totalCommitments: "Total engagements", totalPaid: "Total payé", totalRemaining: "Reste", totalExpenses: "Total dépenses", recentPayments: "Paiements récents", outstandingCommitments: "Engagements ouverts", viewAll: "Voir tout" },
  finance: { ...arDict.finance, title: "Finance", totalRevenue: "Chiffre d'affaires", totalExpenses: "Dépenses", netProfit: "Résultat net", outstandingInvoices: "Factures ouvertes", overdueInvoices: "Factures en retard", cashPosition: "Position de trésorerie", journal: "Journal", cashFlow: "Trésorerie" },
  stock: { ...arDict.stock, title: "Stock", materials: "Matériaux", categories: "Catégories", newMaterial: "Nouveau matériau", currentQty: "Quantité actuelle", lowStock: "Stock faible", movements: "Mouvements" },
  purchaseOrders: { ...arDict.purchaseOrders, title: "Bons de commande", new: "Nouveau bon de commande", supplier: "Fournisseur", project: "Projet", orderDate: "Date de commande", expectedDate: "Date prévue", downloadPdf: "Télécharger PDF" },
  goodsReceipts: { ...arDict.goodsReceipts, title: "Réceptions", new: "Nouvelle réception", supplier: "Fournisseur", project: "Projet" },
  ocr: { ...arDict.ocr, title: "OCR intelligent", scan: "Scanner", scanDocument: "Scanner un document", settings: "Paramètres IA", provider: "Fournisseur", apiKey: "Clé API", uploadDocument: "Importer un document", extractedData: "Données extraites", saveSettings: "Enregistrer les paramètres" },
  language: { title: "Langue", ar: "Darija", fr: "Français", en: "English", switchTo: "Changer la langue" },
  settings: { ...arDict.settings, title: "Paramètres", companyProfile: "Informations entreprise", companyName: "Nom de l'entreprise", address: "Adresse", phone: "Téléphone", email: "Email", website: "Site web", bankName: "Banque", bankRib: "RIB", defaultTvaRate: "TVA par défaut", defaultPaymentTerms: "Conditions de paiement", defaultDocumentFooter: "Pied de page documents", logo: "Logo", uploadLogo: "Importer le logo", removeLogo: "Supprimer le logo", saveSuccess: "Paramètres enregistrés" },
  profile: { title: "Mon profil", fullName: "Nom complet", email: "Email", phone: "Téléphone", role: "Rôle", memberSince: "Membre depuis" },
};

const en: Partial<Dict> = {
  appSubtitle: "Professional construction management",
  nav: { ...arDict.nav, dashboard: "Dashboard", companies: "Companies", clients: "Clients", properties: "Real Estate", sales: "Sales", projects: "Projects", construction: "Construction", siteJournal: "Site Journal", attendance: "Attendance", materials: "Materials", sitePhotos: "Photos", suppliers: "Suppliers", intervenants: "Intervenants", commitments: "Commitments", payments: "Payments", expenses: "Expenses", quotes: "Quotes", invoices: "Invoices", financeDashboard: "Finance", journal: "Journal", cashFlow: "Cash Flow", reports: "Reports", admin: "Administration", settings: "Settings", favorites: "Favorites", profile: "My Profile", purchaseOrders: "Purchase Orders", goodsReceipts: "Goods Receipts", stock: "Stock", stockMovements: "Stock Movements", ocr: "Smart OCR", logout: "Logout" },
  actions: { ...arDict.actions, new: "New", create: "Create", save: "Save", edit: "Edit", update: "Update", delete: "Delete", cancel: "Cancel", close: "Close", search: "Search", filter: "Filter", upload: "Upload", download: "Download", view: "View", saving: "Saving...", loading: "Loading...", uploading: "Uploading..." },
  labels: { ...arDict.labels, name: "Name", email: "Email", phone: "Phone", address: "Address", notes: "Notes", description: "Description", date: "Date", status: "Status", type: "Type", category: "Category", noData: "No data", noResults: "No results", success: "Success" },
  auth: { ...arDict.auth, logout: "Logout", changePassword: "Change Password" },
  dashboard: { ...arDict.dashboard, title: "Dashboard", totalProjects: "Total Projects", totalSuppliers: "Total Suppliers", totalIntervenants: "Total Intervenants", totalCommitments: "Total Commitments", totalPaid: "Total Paid", totalRemaining: "Remaining", totalExpenses: "Total Expenses", recentPayments: "Recent Payments", outstandingCommitments: "Outstanding Commitments", viewAll: "View All" },
  finance: { ...arDict.finance, title: "Finance", totalRevenue: "Total Revenue", totalExpenses: "Total Expenses", netProfit: "Net Profit", outstandingInvoices: "Outstanding Invoices", overdueInvoices: "Overdue Invoices", cashPosition: "Cash Position", journal: "Journal", cashFlow: "Cash Flow" },
  stock: { ...arDict.stock, title: "Stock", materials: "Materials", categories: "Categories", newMaterial: "New Material", currentQty: "Current Qty", lowStock: "Low Stock", movements: "Movements" },
  purchaseOrders: { ...arDict.purchaseOrders, title: "Purchase Orders", new: "New Purchase Order", supplier: "Supplier", project: "Project", orderDate: "Order Date", expectedDate: "Expected Date", downloadPdf: "Download PDF" },
  goodsReceipts: { ...arDict.goodsReceipts, title: "Goods Receipts", new: "New Receipt", supplier: "Supplier", project: "Project" },
  ocr: { ...arDict.ocr, title: "Smart OCR", scan: "Scan", scanDocument: "Scan Document", settings: "AI Settings", provider: "Provider", apiKey: "API Key", uploadDocument: "Upload Document", extractedData: "Extracted Data", saveSettings: "Save Settings" },
  language: { title: "Language", ar: "Darija", fr: "Français", en: "English", switchTo: "Switch language" },
  settings: { ...arDict.settings, title: "Settings", companyProfile: "Company Information", companyName: "Company name", address: "Address", phone: "Phone", email: "Email", website: "Website", bankName: "Bank name", bankRib: "RIB", defaultTvaRate: "Default TVA", defaultPaymentTerms: "Payment terms", defaultDocumentFooter: "Document footer", logo: "Logo", uploadLogo: "Upload logo", removeLogo: "Delete logo", saveSuccess: "Settings saved" },
  profile: { title: "My Profile", fullName: "Full name", email: "Email", phone: "Phone", role: "Role", memberSince: "Member since" },
};

const dictionaries: Record<Lang, Dict> = { ar: arDict, fr: { ...arDict, ...fr } as Dict, en: { ...arDict, ...en } as Dict };
const I18nContext = createContext<{ dict: Dict; lang: Lang }>({ dict: arDict, lang: "ar" });

function normalizeLang(language?: string): Lang {
  return language === "fr" || language === "en" ? language : "ar";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const lang = normalizeLang(user?.preferredLanguage);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  return <I18nContext.Provider value={{ dict: dictionaries[lang], lang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
