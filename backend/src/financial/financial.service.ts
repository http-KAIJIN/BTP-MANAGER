import { Injectable, NotFoundException } from '@nestjs/common';
import { CommitmentStatus, Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

type Tx = Prisma.TransactionClient | PrismaService | PrismaClient;

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommitmentBalance(commitmentId: string, client: Tx = this.prisma) {
    const commitment = await client.commitment.findFirst({
      where: { id: commitmentId, deletedAt: null },
      include: { supplier: true, intervenant: true },
    });
    if (!commitment) throw new NotFoundException('Commitment not found');

    const totalPaid = await this.getCommitmentPaidAmount(commitmentId, client);
    const agreedAmount = Number(commitment.agreedAmount);
    const remainingAmount = agreedAmount - totalPaid;

    return {
      commitmentId: commitment.id,
      projectId: commitment.projectId,
      beneficiaryType: commitment.beneficiaryType.toLowerCase(),
      beneficiaryName:
        commitment.supplier?.name ?? commitment.intervenant?.name ?? null,
      agreedAmount,
      totalPaid,
      remainingAmount,
      status: this.calculateCommitmentStatus(
        agreedAmount,
        totalPaid,
      ).toLowerCase(),
    };
  }

  async refreshCommitmentStatus(
    commitmentId: string,
    client: Tx = this.prisma,
  ) {
    const balance = await this.getCommitmentBalance(commitmentId, client);
    await client.commitment.update({
      where: { id: commitmentId },
      data: { status: balance.status.toUpperCase() as CommitmentStatus },
    });
    return balance;
  }

  async getProjectFinancialSummary(projectId: string) {
    await this.ensureProject(projectId);
    const [commitmentsAgg, paymentsAgg, expensesAgg] = await Promise.all([
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
    ]);
    const totalCommitments = Number(commitmentsAgg._sum.agreedAmount ?? 0);
    const totalPaid = Number(paymentsAgg._sum.amount ?? 0);
    const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
    return {
      projectId,
      totalCommitments,
      totalPaid,
      totalRemaining: totalCommitments - totalPaid,
      totalExpenses,
    };
  }

  async getSupplierFinancialSummary(supplierId: string) {
    await this.ensureSupplier(supplierId);
    const [commitmentsAgg, paymentsAgg] = await Promise.all([
      this.prisma.commitment.aggregate({
        where: { supplierId, deletedAt: null },
        _sum: { agreedAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { supplierId, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);
    const totalCommitments = Number(commitmentsAgg._sum.agreedAmount ?? 0);
    const totalPaid = Number(paymentsAgg._sum.amount ?? 0);
    return {
      supplierId,
      totalCommitments,
      totalPaid,
      totalRemaining: totalCommitments - totalPaid,
    };
  }

  async getIntervenantFinancialSummary(intervenantId: string) {
    await this.ensureIntervenant(intervenantId);
    const [commitmentsAgg, paymentsAgg] = await Promise.all([
      this.prisma.commitment.aggregate({
        where: { intervenantId, deletedAt: null },
        _sum: { agreedAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { intervenantId, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);
    const totalCommitments = Number(commitmentsAgg._sum.agreedAmount ?? 0);
    const totalPaid = Number(paymentsAgg._sum.amount ?? 0);
    return {
      intervenantId,
      totalCommitments,
      totalPaid,
      totalRemaining: totalCommitments - totalPaid,
    };
  }

  calculateCommitmentStatus(
    agreedAmount: number,
    totalPaid: number,
  ): CommitmentStatus {
    if (totalPaid === 0) return 'OPEN';
    if (totalPaid < agreedAmount) return 'PARTIALLY_PAID';
    if (totalPaid === agreedAmount) return 'PAID';
    return 'OVERPAID';
  }

  private async getCommitmentPaidAmount(commitmentId: string, client: Tx) {
    const aggregate = await client.payment.aggregate({
      where: { commitmentId, deletedAt: null },
      _sum: { amount: true },
    });
    return Number(aggregate._sum.amount ?? 0);
  }

  private async ensureProject(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
  }

  private async ensureSupplier(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
  }

  private async ensureIntervenant(id: string) {
    const intervenant = await this.prisma.intervenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!intervenant) throw new NotFoundException('Intervenant not found');
  }
}
