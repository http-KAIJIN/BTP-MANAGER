import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMode, Prisma } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { FinancialService } from '../financial/financial.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialService: FinancialService,
  ) {}

  async findAll(query: PaymentQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const paymentMode = query.paymentMode
      ? this.normalizePaymentMode(query.paymentMode)
      : undefined;
    const where: Prisma.PaymentWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.commitmentId ? { commitmentId: query.commitmentId } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.intervenantId ? { intervenantId: query.intervenantId } : {}),
      ...(paymentMode ? { paymentMode } : {}),
      ...(query.search
        ? {
            OR: [
              { notes: { contains: query.search, mode: 'insensitive' } },
              {
                commitment: {
                  description: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          project: true,
          commitment: true,
          supplier: true,
          intervenant: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async create(dto: CreatePaymentDto, actorId: string) {
    const data = await this.buildData(dto);
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { ...data, createdById: actorId },
        include: {
          project: true,
          commitment: true,
          supplier: true,
          intervenant: true,
        },
      });
      await this.financialService.refreshCommitmentStatus(
        payment.commitmentId,
        tx,
      );
      return payment;
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: true,
        commitment: true,
        supplier: true,
        intervenant: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto, actorId: string) {
    const existing = await this.findOne(id);
    const data = await this.buildData({
      ...existing,
      ...dto,
      paymentDate: dto.paymentDate ?? existing.paymentDate.toISOString(),
      amount: dto.amount ?? Number(existing.amount),
      paymentMode: dto.paymentMode ?? existing.paymentMode,
    } as CreatePaymentDto);
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id },
        data: { ...data, updatedById: actorId },
        include: {
          project: true,
          commitment: true,
          supplier: true,
          intervenant: true,
        },
      });
      await this.financialService.refreshCommitmentStatus(
        existing.commitmentId,
        tx,
      );
      if (existing.commitmentId !== payment.commitmentId)
        await this.financialService.refreshCommitmentStatus(
          payment.commitmentId,
          tx,
        );
      return payment;
    });
  }

  async softDelete(id: string, actorId: string) {
    const existing = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: actorId },
      });
      await this.financialService.refreshCommitmentStatus(
        existing.commitmentId,
        tx,
      );
      return { success: true };
    });
  }

  async restore(id: string, actorId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.prisma.$transaction(async (tx) => {
      const restored = await tx.payment.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, updatedById: actorId },
        include: {
          project: true,
          commitment: true,
          supplier: true,
          intervenant: true,
        },
      });
      await this.financialService.refreshCommitmentStatus(
        restored.commitmentId,
        tx,
      );
      return restored;
    });
  }

  private async buildData(
    dto: CreatePaymentDto,
  ): Promise<Prisma.PaymentUncheckedCreateInput> {
    if (dto.amount <= 0)
      throw new BadRequestException('Amount must be greater than 0');
    const paymentMode = this.normalizePaymentMode(dto.paymentMode);
    if (paymentMode === 'CHEQUE' && !dto.chequeNumber?.trim())
      throw new BadRequestException(
        'Cheque number is required for cheque payments',
      );
    const commitment = await this.prisma.commitment.findFirst({
      where: { id: dto.commitmentId, deletedAt: null },
    });
    if (!commitment) throw new BadRequestException('Commitment not found');
    if (dto.projectId !== commitment.projectId)
      throw new BadRequestException(
        'Payment project must match commitment project',
      );
    return {
      projectId: commitment.projectId,
      commitmentId: commitment.id,
      beneficiaryType: commitment.beneficiaryType,
      supplierId: commitment.supplierId,
      intervenantId: commitment.intervenantId,
      paymentDate: new Date(dto.paymentDate),
      amount: dto.amount,
      paymentMode,
      chequeNumber: dto.chequeNumber,
      notes: dto.notes,
    };
  }

  private normalizePaymentMode(value: string): PaymentMode {
    if (value === 'cash' || value === 'CASH') return 'CASH';
    if (value === 'cheque' || value === 'CHEQUE') return 'CHEQUE';
    if (value === 'bank_transfer' || value === 'BANK_TRANSFER')
      return 'BANK_TRANSFER';
    throw new BadRequestException('Invalid payment mode');
  }
}
