import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMode, Prisma } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(query: ExpenseQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.ExpenseWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' } },
              {
                project: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                category: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { project: true, category: true, supplier: true },
      }),
      this.prisma.expense.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }
  async create(dto: CreateExpenseDto, actorId: string) {
    const data = await this.buildData(dto);
    return this.prisma.expense.create({
      data: { ...data, createdById: actorId },
      include: { project: true, category: true, supplier: true },
    });
  }
  async findOne(id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: { project: true, category: true, supplier: true },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }
  async update(id: string, dto: UpdateExpenseDto, actorId: string) {
    const existing = await this.findOne(id);
    const data = await this.buildData({
      ...existing,
      ...dto,
      expenseDate: dto.expenseDate ?? existing.expenseDate.toISOString(),
      amount: dto.amount ?? Number(existing.amount),
      paymentMode: dto.paymentMode ?? existing.paymentMode,
    } as CreateExpenseDto);
    return this.prisma.expense.update({
      where: { id },
      data: { ...data, updatedById: actorId },
      include: { project: true, category: true, supplier: true },
    });
  }
  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId },
    });
    return { success: true };
  }
  async restore(id: string, actorId: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: null, deletedById: null, updatedById: actorId },
      include: { project: true, category: true, supplier: true },
    });
  }
  private async buildData(
    dto: CreateExpenseDto,
  ): Promise<Prisma.ExpenseUncheckedCreateInput> {
    if (dto.amount <= 0)
      throw new BadRequestException('Amount must be greater than 0');
    await this.ensureProject(dto.projectId);
    await this.ensureCategory(dto.categoryId);
    if (dto.supplierId) await this.ensureSupplier(dto.supplierId);
    return {
      projectId: dto.projectId,
      categoryId: dto.categoryId,
      supplierId: dto.supplierId,
      description: dto.description,
      amount: dto.amount,
      expenseDate: new Date(dto.expenseDate),
      paymentMode: this.normalizePaymentMode(dto.paymentMode),
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
  private async ensureProject(id: string) {
    if (
      !id ||
      !(await this.prisma.project.findFirst({ where: { id, deletedAt: null } }))
    )
      throw new BadRequestException('Project not found');
  }
  private async ensureCategory(id: string) {
    if (
      !id ||
      !(await this.prisma.expenseCategory.findFirst({
        where: { id, deletedAt: null, isActive: true },
      }))
    )
      throw new BadRequestException('Expense category not found');
  }
  private async ensureSupplier(id: string) {
    if (
      !(await this.prisma.supplier.findFirst({
        where: { id, deletedAt: null },
      }))
    )
      throw new BadRequestException('Supplier not found');
  }
}
