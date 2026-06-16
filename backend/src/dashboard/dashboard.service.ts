import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalProjects,
      totalSuppliers,
      totalIntervenants,
      commitmentsAgg,
      paymentsAgg,
      expensesAgg,
    ] = await Promise.all([
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.supplier.count({ where: { deletedAt: null } }),
      this.prisma.intervenant.count({ where: { deletedAt: null } }),
      this.prisma.commitment.aggregate({
        where: { deletedAt: null },
        _sum: { agreedAmount: true },
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

    const totalCommitments = Number(commitmentsAgg._sum.agreedAmount ?? 0);
    const totalPaid = Number(paymentsAgg._sum.amount ?? 0);
    const totalExpenses = Number(expensesAgg._sum.amount ?? 0);

    return {
      totalProjects,
      totalSuppliers,
      totalIntervenants,
      totalCommitments,
      totalPaid,
      totalRemaining: totalCommitments - totalPaid,
      totalExpenses,
    };
  }

  async getRecentPayments(limit = 5) {
    return this.prisma.payment.findMany({
      where: { deletedAt: null },
      orderBy: { paymentDate: 'desc' },
      take: limit,
      include: {
        project: { select: { name: true } },
        commitment: { select: { description: true } },
      },
    });
  }

  async getOutstandingCommitments(limit = 10) {
    const commitments = await this.prisma.commitment.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['PAID', 'CANCELLED'] },
      },
      take: limit,
      orderBy: { commitmentDate: 'desc' },
      include: {
        project: { select: { name: true } },
        supplier: { select: { name: true } },
        intervenant: { select: { name: true } },
      },
    });

    return commitments.map((c) => ({
      id: c.id,
      projectName: c.project.name,
      beneficiaryName: c.supplier?.name ?? c.intervenant?.name ?? null,
      beneficiaryType: c.beneficiaryType.toLowerCase(),
      agreedAmount: Number(c.agreedAmount),
      description: c.description,
      status: c.status.toLowerCase(),
    }));
  }
}
