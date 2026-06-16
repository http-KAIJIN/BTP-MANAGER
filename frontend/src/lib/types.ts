export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  roles: { code: string; name: string }[];
  createdAt: string;
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
