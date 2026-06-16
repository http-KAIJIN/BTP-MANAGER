import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      revenueAgg,
      expensesAgg,
      outstandAgg,
      overdueAgg,
      thisMonthRevenue,
      thisMonthExpenses,
      salesPaid,
      salePaymentsThisMonth,
    ] = await Promise.all([
      // Total revenue = sum of invoice paidAmount (money received from clients)
      this.prisma.invoice.aggregate({
        where: { deletedAt: null, status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] } },
        _sum: { paidAmount: true },
      }),
      // Total expenses = sum of expenses + sum of commitment payments (money paid out)
      this.prisma.expense.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
      // Outstanding invoices (SENT or PARTIALLY_PAID)
      this.prisma.invoice.aggregate({
        where: { deletedAt: null, status: { in: ['SENT', 'PARTIALLY_PAID'] } },
        _sum: { remainingAmount: true },
        _count: true,
      }),
      // Overdue invoices (past due date + not fully paid)
      this.prisma.invoice.count({
        where: {
          deletedAt: null,
          status: { in: ['SENT', 'PARTIALLY_PAID', 'DRAFT'] },
          dueDate: { not: null, lt: now },
        },
      }),
      // This month revenue = sum of invoice payments this month
      this.prisma.invoicePayment.aggregate({
        where: { deletedAt: null, paymentDate: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { amount: true },
      }),
      // This month expenses = sum of commitment payments this month + expenses this month
      Promise.all([
        this.prisma.payment.aggregate({
          where: { deletedAt: null, paymentDate: { gte: startOfMonth, lt: startOfNextMonth } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { deletedAt: null, expenseDate: { gte: startOfMonth, lt: startOfNextMonth } },
          _sum: { amount: true },
        }),
      ]),
      // Total payments from sales (real estate)
      this.prisma.sale.aggregate({
        where: { deletedAt: null },
        _sum: { downPayment: true },
      }),
      // Sale payments this month
      this.prisma.salePayment.aggregate({
        where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue =
      Number(revenueAgg._sum.paidAmount ?? 0) +
      Number(salesPaid._sum.downPayment ?? 0);
    const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
    const netProfit = totalRevenue - totalExpenses;

    const thisMonthRevenueAmt =
      Number(thisMonthRevenue._sum.amount ?? 0) +
      Number(salePaymentsThisMonth._sum.amount ?? 0);
    const thisMonthExpensesAmt =
      Number(thisMonthExpenses[0]._sum.amount ?? 0) +
      Number(thisMonthExpenses[1]._sum.amount ?? 0);
    const profitThisMonth = thisMonthRevenueAmt - thisMonthExpensesAmt;

    // Cash position = all money received (invoice payments + sale payments)
    // minus all money paid out (commitment payments + expenses)
    const [allInvoicesPaid, allSalePayments, allCommitmentPayments, allExpenses] =
      await Promise.all([
        this.prisma.invoicePayment.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.salePayment.aggregate({
          where: {},
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

    const cashIn =
      Number(allInvoicesPaid._sum.amount ?? 0) +
      Number(allSalePayments._sum.amount ?? 0);
    const cashOut =
      Number(allCommitmentPayments._sum.amount ?? 0) +
      Number(allExpenses._sum.amount ?? 0);
    const cashPosition = cashIn - cashOut;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstandingInvoices: {
        count: outstandAgg._count,
        amount: Number(outstandAgg._sum.remainingAmount ?? 0),
      },
      overdueInvoices: { count: overdueAgg },
      cashPosition,
      revenueThisMonth: thisMonthRevenueAmt,
      expensesThisMonth: thisMonthExpensesAmt,
      profitThisMonth,
    };
  }

  async getBudgetVsActual(projectId?: string) {
    const whereProject = projectId ? { id: projectId, deletedAt: null } : { deletedAt: null };

    interface ProjectBudget {
      id: string;
      name: string;
      totalCommitments: number;
      totalPaid: number;
      totalExpenses: number;
      totalInvoiced: number;
      totalReceived: number;
    }

    // Use batched pages to avoid loading all projects at once
    const batchSize = 50;
    const results: ProjectBudget[] = [];

    const totalProjects = await this.prisma.project.count({ where: whereProject });
    let processed = 0;

    while (processed < totalProjects) {
      const batch = await this.prisma.project.findMany({
        where: whereProject,
        take: batchSize,
        skip: processed,
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });

      if (batch.length === 0) break;

      const batchResults = await Promise.all(
        batch.map(async (p) => {
          const [commitAgg, paidAgg, expenseAgg, invoiceAgg, invoicePaidAgg] =
            await Promise.all([
              this.prisma.commitment.aggregate({
                where: { projectId: p.id, deletedAt: null },
                _sum: { agreedAmount: true },
              }),
              this.prisma.payment.aggregate({
                where: { projectId: p.id, deletedAt: null },
                _sum: { amount: true },
              }),
              this.prisma.expense.aggregate({
                where: { projectId: p.id, deletedAt: null },
                _sum: { amount: true },
              }),
              this.prisma.invoice.aggregate({
                where: { projectId: p.id, deletedAt: null, status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] } },
                _sum: { totalTTC: true },
              }),
              this.prisma.invoice.aggregate({
                where: { projectId: p.id, deletedAt: null },
                _sum: { paidAmount: true },
              }),
            ]);

          return {
            id: p.id,
            name: p.name,
            totalCommitments: Number(commitAgg._sum.agreedAmount ?? 0),
            totalPaid: Number(paidAgg._sum.amount ?? 0),
            totalExpenses: Number(expenseAgg._sum.amount ?? 0),
            totalInvoiced: Number(invoiceAgg._sum.totalTTC ?? 0),
            totalReceived: Number(invoicePaidAgg._sum.paidAmount ?? 0),
          };
        }),
      );

      results.push(...batchResults);
      processed += batch.length;
    }

    return results.map((r) => {
      const totalCosts = r.totalCommitments + r.totalExpenses;
      const estimatedProfit = r.totalInvoiced - totalCosts;
      const marginPct =
        r.totalInvoiced > 0
          ? Math.round((estimatedProfit / r.totalInvoiced) * 10000) / 100
          : 0;

      // Budget status
      let budgetStatus: 'healthy' | 'warning' | 'exceeded';
      if (r.totalPaid === 0 && r.totalCommitments === 0) {
        budgetStatus = 'healthy';
      } else if (r.totalPaid > r.totalCommitments) {
        budgetStatus = 'exceeded';
      } else if (r.totalPaid / r.totalCommitments > 0.8) {
        budgetStatus = 'warning';
      } else {
        budgetStatus = 'healthy';
      }

      return {
        projectId: r.id,
        projectName: r.name,
        budget: r.totalCommitments,
        committed: r.totalCommitments,
        paid: r.totalPaid,
        remaining: r.totalCommitments - r.totalPaid,
        expenses: r.totalExpenses,
        totalInvoiced: r.totalInvoiced,
        totalReceived: r.totalReceived,
        estimatedProfit,
        marginPct,
        budgetStatus,
      };
    });
  }

  async getProjectProfitability(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');

    const [commitAgg, paidAgg, expenseAgg, invoiceAgg, invoicePaidAgg] =
      await Promise.all([
        this.prisma.commitment.aggregate({
          where: { projectId, deletedAt: null },
          _sum: { agreedAmount: true },
        }),
        this.prisma.payment.aggregate({
          where: { projectId, deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { projectId, deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.invoice.aggregate({
          where: { projectId, deletedAt: null, status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] } },
          _sum: { totalTTC: true },
        }),
        this.prisma.invoice.aggregate({
          where: { projectId, deletedAt: null },
          _sum: { paidAmount: true },
        }),
      ]);

    const totalInvoiced = Number(invoiceAgg._sum.totalTTC ?? 0);
    const totalReceived = Number(invoicePaidAgg._sum.paidAmount ?? 0);
    const totalCommitments = Number(commitAgg._sum.agreedAmount ?? 0);
    const totalPaidOut = Number(paidAgg._sum.amount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

    const grossProfit = totalInvoiced - totalExpenses;
    const netProfit = totalInvoiced - totalExpenses - totalCommitments;
    const marginPct =
      totalInvoiced > 0
        ? Math.round((netProfit / totalInvoiced) * 10000) / 100
        : 0;

    return {
      projectId,
      totalInvoiced,
      totalReceived,
      totalCommitments,
      totalPaidOut,
      totalExpenses,
      grossProfit,
      netProfit,
      marginPct,
    };
  }

  async getJournal(options: {
    page: number;
    limit: number;
    type?: string;
    projectId?: string;
    search?: string;
  }) {
    const { page, limit, type, projectId, search } = options;
    const offset = (page - 1) * limit;

    // Build entries from multiple sources using Prisma queries
    // then combine and sort in-memory (limited by pagination)

    const whereProject = projectId ? { projectId } : {};
    const whereSearch = search
      ? { description: { contains: search, mode: 'insensitive' as const } }
      : {};

    const results: {
      date: string;
      type: string;
      projectId: string | null;
      projectName: string | null;
      counterparty: string | null;
      amount: number;
      reference: string;
      source: string;
    }[] = [];

    if (!type || type === 'INVOICE') {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          ...(projectId ? { projectId } : {}),
          ...(search
            ? {
                OR: [
                  { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
                  { client: { name: { contains: search, mode: 'insensitive' as const } } },
                ],
              }
            : {}),
        },
        take: limit,
        skip: offset,
        orderBy: { invoiceDate: 'desc' },
        include: {
          client: { select: { name: true } },
          project: { select: { name: true } },
        },
      });
      for (const inv of invoices) {
        results.push({
          date: inv.invoiceDate.toISOString().slice(0, 10),
          type: 'INVOICE',
          projectId: inv.projectId,
          projectName: inv.project?.name ?? null,
          counterparty: inv.client.name,
          amount: Number(inv.totalTTC),
          reference: inv.invoiceNumber,
          source: 'INVOICE',
        });
      }
    }

    if (!type || type === 'PAYMENT') {
      const payments = await this.prisma.payment.findMany({
        where: {
          deletedAt: null,
          ...whereProject,
          ...(search
            ? { description: { contains: search, mode: 'insensitive' as const } }
            : {}),
        },
        take: limit,
        skip: offset,
        orderBy: { paymentDate: 'desc' },
        include: {
          project: { select: { name: true } },
          supplier: { select: { name: true } },
          intervenant: { select: { name: true } },
          commitment: { select: { description: true } },
        },
      });
      for (const p of payments) {
        results.push({
          date: p.paymentDate.toISOString().slice(0, 10),
          type: 'PAYMENT',
          projectId: p.projectId,
          projectName: p.project.name,
          counterparty: p.supplier?.name ?? p.intervenant?.name ?? null,
          amount: -Number(p.amount),
          reference: p.commitment.description.slice(0, 60),
          source: 'PAYMENT',
        });
      }
    }

    if (!type || type === 'EXPENSE') {
      const expenses = await this.prisma.expense.findMany({
        where: {
          deletedAt: null,
          ...whereProject,
          ...(search
            ? { description: { contains: search, mode: 'insensitive' as const } }
            : {}),
        },
        take: limit,
        skip: offset,
        orderBy: { expenseDate: 'desc' },
        include: {
          project: { select: { name: true } },
          category: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      });
      for (const e of expenses) {
        results.push({
          date: e.expenseDate.toISOString().slice(0, 10),
          type: 'EXPENSE',
          projectId: e.projectId,
          projectName: e.project?.name ?? null,
          counterparty: e.supplier?.name ?? e.category?.name ?? null,
          amount: -Number(e.amount),
          reference: e.description.slice(0, 60),
          source: 'EXPENSE',
        });
      }
    }

    if (!type || type === 'COMMITMENT') {
      const commitments = await this.prisma.commitment.findMany({
        where: {
          deletedAt: null,
          ...whereProject,
          ...whereSearch,
        },
        take: limit,
        skip: offset,
        orderBy: { commitmentDate: 'desc' },
        include: {
          project: { select: { name: true } },
          supplier: { select: { name: true } },
          intervenant: { select: { name: true } },
        },
      });
      for (const c of commitments) {
        results.push({
          date: c.commitmentDate.toISOString().slice(0, 10),
          type: 'COMMITMENT',
          projectId: c.projectId,
          projectName: c.project.name,
          counterparty: c.supplier?.name ?? c.intervenant?.name ?? null,
          amount: -Number(c.agreedAmount),
          reference: c.description.slice(0, 60),
          source: 'COMMITMENT',
        });
      }
    }

    // Sort by date descending
    results.sort((a, b) => b.date.localeCompare(a.date));

    const total = results.length;
    const sliced = results.slice(0, limit);

    return {
      data: sliced,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCashFlow() {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      upcomingInvoicePayments,
      upcomingCommitments,
      cashPosition,
    ] = await Promise.all([
      // Invoices with remaining amount > 0 (not yet fully paid)
      this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          status: { in: ['SENT', 'PARTIALLY_PAID', 'DRAFT'] },
          remainingAmount: { gt: 0 },
        },
        take: 100,
        orderBy: { dueDate: 'asc' },
        include: {
          client: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
      // Upcoming commitments (not fully paid)
      this.prisma.commitment.findMany({
        where: {
          deletedAt: null,
          status: { in: ['OPEN', 'PARTIALLY_PAID'] },
        },
        take: 100,
        orderBy: { commitmentDate: 'asc' },
        include: {
          project: { select: { name: true } },
          supplier: { select: { name: true } },
          intervenant: { select: { name: true } },
        },
      }),
      // Current cash position
      this.getCashPosition(),
    ]);

    // Filter to next 30 days
    const upcomingInflows = upcomingInvoicePayments
      .filter((inv) => inv.dueDate && inv.dueDate <= thirtyDaysLater)
      .map((inv) => ({
        date: inv.dueDate!.toISOString().slice(0, 10),
        description: `${inv.invoiceNumber} - ${inv.client.name}`,
        project: inv.project?.name ?? null,
        amount: Number(inv.remainingAmount),
        type: 'INVOICE' as const,
      }));

    const upcomingOutflows = upcomingCommitments
      .filter((c) => c.commitmentDate <= thirtyDaysLater)
      .map((c) => ({
        date: c.commitmentDate.toISOString().slice(0, 10),
        description: c.description.slice(0, 80),
        project: c.project.name,
        counterparty: c.supplier?.name ?? c.intervenant?.name ?? null,
        amount: Number(c.agreedAmount),
        type: 'COMMITMENT' as const,
      }));

    const totalInflow = upcomingInflows.reduce((s, i) => s + i.amount, 0);
    const totalOutflow = upcomingOutflows.reduce((s, o) => s + o.amount, 0);

    // Build day-by-day forecast
    const forecast: {
      date: string;
      dayLabel: string;
      inflows: number;
      outflows: number;
      dailyNet: number;
      runningBalance: number;
    }[] = [];

    let runningBalance = cashPosition;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayInflow = upcomingInflows
        .filter((inf) => inf.date === dateStr)
        .reduce((s, inf) => s + inf.amount, 0);
      const dayOutflow = upcomingOutflows
        .filter((of) => of.date === dateStr)
        .reduce((s, of) => s + of.amount, 0);
      const dailyNet = dayInflow - dayOutflow;
      runningBalance += dailyNet;

      forecast.push({
        date: dateStr,
        dayLabel: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        inflows: dayInflow,
        outflows: dayOutflow,
        dailyNet,
        runningBalance,
      });
    }

    return {
      cashPosition,
      totalInflow30d: totalInflow,
      totalOutflow30d: totalOutflow,
      expectedBalance30d: cashPosition + totalInflow - totalOutflow,
      upcomingInflows,
      upcomingOutflows,
      forecast,
    };
  }

  private async getCashPosition(): Promise<number> {
    const [invoicesPaid, salePayments, commitmentPayments, expenses] =
      await Promise.all([
        this.prisma.invoicePayment.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.salePayment.aggregate({
          where: {},
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

    const cashIn =
      Number(invoicesPaid._sum.amount ?? 0) +
      Number(salePayments._sum.amount ?? 0);
    const cashOut =
      Number(commitmentPayments._sum.amount ?? 0) +
      Number(expenses._sum.amount ?? 0);
    return cashIn - cashOut;
  }
}
