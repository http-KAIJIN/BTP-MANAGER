import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NumbersService } from '../numbers/numbers.service';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteQueryDto } from './dto/quote-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumbersService,
  ) {}

  async findAll(query: QuoteQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.QuoteWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { quoteNumber: { contains: query.search, mode: 'insensitive' } },
              { title: { contains: query.search, mode: 'insensitive' } },
              { client: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          items: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, phone: true, address: true, cin: true } },
        project: { select: { id: true, name: true, city: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        invoices: {
          where: { deletedAt: null },
          select: { id: true, invoiceNumber: true, status: true, totalTTC: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async create(dto: CreateQuoteDto, actorId: string) {
    const quoteNumber = await this.numbers.nextNumber('QUOTE');
    const items = dto.items.map((item, idx) => ({
      description: item.description,
      quantity: new Prisma.Decimal(item.quantity),
      unitPrice: new Prisma.Decimal(item.unitPrice),
      totalHT: new Prisma.Decimal(item.quantity * item.unitPrice),
      sortOrder: idx,
    }));
    const subtotalHT = items.reduce((s, i) => s + Number(i.totalHT), 0);
    const taxRate = dto.taxRate ?? 0;
    const taxAmount = subtotalHT * (taxRate / 100);
    const totalTTC = subtotalHT + taxAmount;

    return this.prisma.quote.create({
      data: {
        quoteNumber,
        clientId: dto.clientId,
        projectId: dto.projectId,
        quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        title: dto.title,
        notes: dto.notes,
        subtotalHT: new Prisma.Decimal(subtotalHT),
        taxRate: new Prisma.Decimal(taxRate),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalTTC: new Prisma.Decimal(totalTTC),
        createdById: actorId,
        items: { create: items },
      },
      include: {
        client: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateQuoteDto, actorId: string) {
    const existing = await this.prisma.quote.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Quote not found');
    if (existing.status !== 'DRAFT') throw new ConflictException('Only draft quotes can be edited');

    const updateData: any = { updatedById: actorId };
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.quoteDate !== undefined) updateData.quoteDate = new Date(dto.quoteDate);
    if (dto.validUntil !== undefined) updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.items) {
      const items = dto.items.map((item, idx) => ({
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(item.unitPrice),
        totalHT: new Prisma.Decimal(item.quantity * item.unitPrice),
        sortOrder: idx,
      }));
      const subtotalHT = items.reduce((s, i) => s + Number(i.totalHT), 0);
      const taxRate = dto.taxRate ?? Number(existing.taxRate);
      const taxAmount = subtotalHT * (taxRate / 100);
      const totalTTC = subtotalHT + taxAmount;
      updateData.subtotalHT = new Prisma.Decimal(subtotalHT);
      updateData.taxRate = new Prisma.Decimal(taxRate);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalTTC = new Prisma.Decimal(totalTTC);

      await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });
      await this.prisma.quoteItem.createMany({ data: items.map((i) => ({ ...i, quoteId: id })) });
    } else if (dto.taxRate !== undefined) {
      const taxRate = dto.taxRate;
      const taxAmount = Number(existing.subtotalHT) * (taxRate / 100);
      updateData.taxRate = new Prisma.Decimal(taxRate);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalTTC = new Prisma.Decimal(Number(existing.subtotalHT) + taxAmount);
    }

    return this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async transitionStatus(id: string, status: string, actorId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const transitions: Record<string, string[]> = {
      SENT: ['DRAFT'],
      ACCEPTED: ['SENT'],
      REJECTED: ['SENT'],
    };

    const allowed = transitions[status];
    if (!allowed || !allowed.includes(quote.status)) {
      throw new BadRequestException(`Cannot transition from ${quote.status} to ${status}`);
    }

    return this.prisma.quote.update({
      where: { id },
      data: { status: status as any, updatedById: actorId },
      select: { id: true, quoteNumber: true, status: true },
    });
  }

  async softDelete(id: string, actorId: string) {
    const quote = await this.prisma.quote.findFirst({ where: { id, deletedAt: null } });
    if (!quote) throw new NotFoundException('Quote not found');
    return this.prisma.quote.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'CANCELLED' as any },
    });
  }

  async restore(id: string, actorId: string) {
    const quote = await this.prisma.quote.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!quote) throw new NotFoundException('Archived quote not found');
    return this.prisma.quote.update({
      where: { id },
      data: { deletedAt: null, deletedById: null, updatedById: actorId, status: 'DRAFT' as any },
    });
  }
}
