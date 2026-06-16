import { Injectable, NotFoundException } from '@nestjs/common';
import { FinancialService } from '../financial/financial.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialService,
  ) {}

  async getProjectReport(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: {
        executingCompany: true,
        ownerCompany: true,
        commitments: {
          where: { deletedAt: null },
          include: { supplier: true, intervenant: true },
        },
        payments: { where: { deletedAt: null } },
        expenses: { where: { deletedAt: null }, include: { category: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const financialSummary =
      await this.financial.getProjectFinancialSummary(projectId);

    // Get construction progress
    let constructionProgress = 0;
    try {
      const phases = await this.prisma.constructionPhase.findMany({
        where: { projectId, deletedAt: null },
      });
      if (phases.length > 0) {
        constructionProgress = Math.round(
          phases.reduce((sum, p) => sum + p.progress, 0) / phases.length,
        );
      }
    } catch {
      // construction module may not be available
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        city: project.city,
        status: project.status,
        startDate: project.startDate,
        expectedEndDate: project.expectedEndDate,
        executingCompany: project.executingCompany?.name ?? null,
        ownerCompany: project.ownerCompany?.name ?? null,
      },
      financial: financialSummary,
      constructionProgress,
      commitments: project.commitments.map((c) => ({
        id: c.id,
        description: c.description,
        beneficiaryName: c.supplier?.name ?? c.intervenant?.name ?? null,
        agreedAmount: Number(c.agreedAmount),
        status: c.status,
      })),
      payments: project.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
        paymentMode: p.paymentMode,
      })),
      expensesByCategory: this.groupExpensesByCategory(
        project.expenses.map((e) => ({
          amount: Number(e.amount),
          category: e.category,
        })),
      ),
    };
  }

  async getSupplierReport(supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const financial =
      await this.financial.getSupplierFinancialSummary(supplierId);
    const commitments = await this.prisma.commitment.findMany({
      where: { supplierId, deletedAt: null },
      include: { project: { select: { name: true } } },
    });

    return {
      supplier: { id: supplier.id, name: supplier.name },
      financial,
      commitments: commitments.map((c) => ({
        projectName: c.project.name,
        description: c.description,
        agreedAmount: Number(c.agreedAmount),
        status: c.status,
      })),
    };
  }

  async getIntervenantReport(intervenantId: string) {
    const intervenant = await this.prisma.intervenant.findFirst({
      where: { id: intervenantId, deletedAt: null },
    });
    if (!intervenant) throw new NotFoundException('Intervenant not found');

    const financial =
      await this.financial.getIntervenantFinancialSummary(intervenantId);
    const commitments = await this.prisma.commitment.findMany({
      where: { intervenantId, deletedAt: null },
      include: { project: { select: { name: true } } },
    });

    return {
      intervenant: {
        id: intervenant.id,
        name: intervenant.name,
        trade: intervenant.trade,
      },
      financial,
      commitments: commitments.map((c) => ({
        projectName: c.project.name,
        description: c.description,
        agreedAmount: Number(c.agreedAmount),
        status: c.status,
      })),
    };
  }

  async getProjectsCsv(): Promise<string> {
    const header =
      'Name,City,Status,Start Date,Executing Company,Owner Company,Total Paid,Total Expenses\n';
    const batchSize = 200;
    let allRows: string[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await this.prisma.project.findMany({
        where: { deletedAt: null },
        take: batchSize,
        skip,
        orderBy: { createdAt: 'asc' },
        include: {
          executingCompany: { select: { name: true } },
          ownerCompany: { select: { name: true } },
          payments: { where: { deletedAt: null }, select: { amount: true } },
          expenses: { where: { deletedAt: null }, select: { amount: true } },
        },
      });

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      const rows = batch.map((p) => {
        const totalPaid = p.payments.reduce((s, p) => s + Number(p.amount), 0);
        const totalExpenses = p.expenses.reduce(
          (s, e) => s + Number(e.amount),
          0,
        );
        return `${p.name},${p.city},${p.status},${p.startDate.toISOString().split('T')[0]},${p.executingCompany?.name ?? ''},${p.ownerCompany?.name ?? ''},${totalPaid},${totalExpenses}`;
      });

      allRows.push(...rows);
      skip += batch.length;
    }

    return header + allRows.join('\n');
  }

  private groupExpensesByCategory(
    expenses: { amount: number; category: { name: string } }[],
  ) {
    const groups: Record<string, number> = {};
    for (const e of expenses) {
      const name = e.category.name;
      groups[name] = (groups[name] ?? 0) + Number(e.amount);
    }
    return Object.entries(groups).map(([category, total]) => ({
      category,
      total,
    }));
  }
}
