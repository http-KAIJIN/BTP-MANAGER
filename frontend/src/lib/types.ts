export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  roles: { code: string; name: string }[];
  preferredLanguage?: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
  rolePermissions: RolePermission[];
}

export interface RolePermission {
  permission: Permission;
}

export interface Permission {
  id: string;
  code: string;
  description: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  totalProjects: number;
  totalSuppliers: number;
  totalIntervenants: number;
  totalCommitments: number;
  totalPaid: number;
  totalRemaining: number;
  totalExpenses: number;
}

export interface RecentPayment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  project: { name: string };
  commitment: { description: string };
}

export interface OutstandingCommitment {
  id: string;
  projectName: string;
  beneficiaryName: string | null;
  beneficiaryType: string;
  agreedAmount: number;
  description: string;
  status: string;
}

export interface Company {
  id: string;
  name: string;
  ice: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  managerName: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  cin: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  projects?: { id: string; name: string; city: string | null; status: string }[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  startDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  projectType: string | null;
  ownershipType: string | null;
  ownerCompanyId: string | null;
  externalClientName: string | null;
  externalClientPhone: string | null;
  externalClientCompany: string | null;
  executingCompanyId: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  ownerCompany?: Company | null;
  executingCompany?: Company | null;
}

export interface FinancialSummary {
  projectId?: string;
  supplierId?: string;
  intervenantId?: string;
  totalCommitments: number;
  totalPaid: number;
  totalRemaining: number;
  totalExpenses?: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  category: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface Intervenant {
  id: string;
  name: string;
  phone: string | null;
  trade: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface Commitment {
  id: string;
  projectId: string;
  beneficiaryType: string;
  supplierId: string | null;
  intervenantId: string | null;
  description: string;
  agreedAmount: number;
  commitmentDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
  project?: Project;
  supplier?: Supplier | null;
  intervenant?: Intervenant | null;
}

export interface Payment {
  id: string;
  projectId: string;
  commitmentId: string;
  beneficiaryType: string;
  supplierId: string | null;
  intervenantId: string | null;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  chequeNumber: string | null;
  notes: string | null;
  createdAt: string;
  project?: Project;
  commitment?: Commitment;
  supplier?: Supplier | null;
  intervenant?: Intervenant | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface Expense {
  id: string;
  projectId: string;
  categoryId: string;
  supplierId: string | null;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMode: string;
  notes: string | null;
  createdAt: string;
  project?: Project;
  category?: ExpenseCategory;
  supplier?: Supplier | null;
}

export interface Property {
  id: string;
  reference: string;
  type: string | null;
  surface: number | null;
  projectId: string;
  price: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  project?: { id: string; name: string };
}

export interface Sale {
  id: string;
  clientId: string;
  propertyId: string;
  salePrice: number;
  downPayment: number;
  saleDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
  client?: { id: string; name: string };
  property?: { id: string; reference: string; type: string };
  payments?: SalePayment[];
  totalPaid?: number;
  remainingBalance?: number;
}

export interface SalePayment {
  id: string;
  saleId: string;
  amount: number;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
  sortOrder: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  projectId: string | null;
  quoteDate: string;
  validUntil: string | null;
  status: string;
  title: string | null;
  notes: string | null;
  subtotalHT: number;
  taxRate: number;
  taxAmount: number;
  totalTTC: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdById: string;
  updatedById: string | null;
  deletedById: string | null;
  client: { id: string; name: string };
  project?: { id: string; name: string } | null;
  items: QuoteItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
  sortOrder: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  notes: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId: string | null;
  clientId: string;
  projectId: string | null;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  title: string | null;
  notes: string | null;
  subtotalHT: number;
  taxRate: number;
  taxAmount: number;
  totalTTC: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdById: string;
  updatedById: string | null;
  deletedById: string | null;
  client: { id: string; name: string };
  project?: { id: string; name: string } | null;
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

export interface MaterialCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface MaterialCatalog {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  unit: string;
  currentQty: number;
  minQty: number;
  reorderQty: number | null;
  unitPrice: number | null;
  isActive: boolean;
  category?: MaterialCategory | null;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
  receivedQty: number;
  sortOrder: number;
  materialId: string | null;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  projectId: string | null;
  orderDate: string;
  expectedDate: string | null;
  status: string;
  title: string | null;
  notes: string | null;
  subtotalHT: number;
  taxRate: number;
  taxAmount: number;
  totalTTC: number;
  supplier: { id: string; name: string; phone?: string | null };
  project?: { id: string; name: string; city?: string | null } | null;
  items: PurchaseOrderItem[];
  _count?: { items: number; receipts: number };
}

export interface GoodsReceiptItem {
  id: string;
  receiptId: string;
  orderItemId: string;
  materialId: string | null;
  description: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
  totalHT: number;
  sortOrder: number;
  orderItem?: { id: string; quantity: number; receivedQty: number };
  material?: { id: string; name: string; unit: string } | null;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  orderId: string;
  projectId: string | null;
  receiptDate: string;
  supplierRef: string | null;
  status: string;
  notes: string | null;
  order: { id: string; orderNumber: string; supplierId?: string; status?: string };
  project?: { id: string; name: string; city?: string | null } | null;
  createdBy?: { id: string; fullName: string };
  items: GoodsReceiptItem[];
  _count?: { items: number };
}

export interface StockMovement {
  id: string;
  materialId: string;
  projectId: string | null;
  type: string;
  quantity: number;
  unitPrice: number | null;
  totalCost: number | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  material: { id: string; name: string; unit: string };
  project?: { id: string; name: string } | null;
}

export interface StockDashboard {
  lowStockCount: number;
  totalStockValue: number;
  lowStockItems: { id: string; name: string; unit: string; currentQty: number; minQty: number; unitPrice: number }[];
  mostUsedMaterials: { materialId: string; materialName: string; unit: string; totalConsumed: number }[];
}

export interface FinanceDashboard {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingInvoices: { count: number; amount: number };
  overdueInvoices: { count: number };
  cashPosition: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  profitThisMonth: number;
}

export interface BudgetVsActual {
  projectId: string;
  projectName: string;
  budget: number;
  committed: number;
  paid: number;
  remaining: number;
  expenses: number;
  totalInvoiced: number;
  totalReceived: number;
  estimatedProfit: number;
  marginPct: number;
  budgetStatus: 'healthy' | 'warning' | 'exceeded';
}

export interface ProjectProfitability {
  projectId: string;
  totalInvoiced: number;
  totalReceived: number;
  totalCommitments: number;
  totalPaidOut: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  marginPct: number;
}

export interface JournalEntry {
  date: string;
  type: string;
  projectId: string | null;
  projectName: string | null;
  counterparty: string | null;
  amount: number;
  reference: string;
  source: string;
}

export interface CashFlowForecast {
  date: string;
  dayLabel: string;
  inflows: number;
  outflows: number;
  dailyNet: number;
  runningBalance: number;
}

export interface CashFlow {
  cashPosition: number;
  totalInflow30d: number;
  totalOutflow30d: number;
  expectedBalance30d: number;
  upcomingInflows: {
    date: string;
    description: string;
    project: string | null;
    amount: number;
    type: string;
  }[];
  upcomingOutflows: {
    date: string;
    description: string;
    project: string;
    counterparty: string | null;
    amount: number;
    type: string;
  }[];
  forecast: CashFlowForecast[];
}

export interface SiteJournalPhoto {
  id: string;
  journalId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  photoType: string;
  createdAt: string;
}

export interface SiteJournal {
  id: string;
  projectId: string;
  date: string;
  weather: string | null;
  progress: number;
  summary: string | null;
  workPerformed: string | null;
  problems: string | null;
  decisions: string | null;
  nextActions: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  photos: SiteJournalPhoto[];
  attendances?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  journalId: string;
  projectId: string;
  date: string;
  intervenantId: string;
  isPresent: boolean;
  hoursWorked: number | null;
  dailyCost: number | null;
  intervenant: { id: string; name: string; trade: string | null };
}

export interface AttendanceDashboard {
  presentToday: { id: string; name: string; trade: string | null; hoursWorked: number; dailyCost: number }[];
  totalWorkersToday: number;
  totalPresentToday: number;
  totalAbsentToday: number;
  totalDailyCost: number;
  totalHoursToday: number;
  totalProjectCost: number;
  totalProjectHours: number;
  date: string;
}

export interface MaterialUsage {
  id: string;
  projectId: string;
  materialName: string;
  quantity: number;
  unit: string;
  cost: number;
  supplierId: string | null;
  usageDate: string;
  notes: string | null;
  createdAt: string;
}

export interface MaterialReports {
  totalCost: number;
  totalQuantity: number;
  totalEntries: number;
  byMaterial: { material: string; quantity: number; cost: number }[];
  bySupplier: { supplierId: string; cost: number }[];
}

export interface PlannedVsActual {
  projectId: string;
  plannedPct: number;
  actualPct: number;
  delay: number;
  status: 'ahead' | 'on_track' | 'delayed';
}
