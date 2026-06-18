import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NumbersService } from '../numbers/numbers.service';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { CreateInvoiceDto, RegisterPaymentDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumbersService,
  ) {}

  async findAll(query: InvoiceQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.InvoiceWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.quoteId ? { quoteId: query.quoteId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
              { title: { contains: query.search, mode: 'insensitive' } },
              { client: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          quote: { select: { id: true, quoteNumber: true } },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, phone: true, address: true, cin: true } },
        project: { select: { id: true, name: true, city: true } },
        quote: { select: { id: true, quoteNumber: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
          select: { id: true, amount: true, paymentDate: true, paymentMode: true, notes: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(dto: CreateInvoiceDto, actorId: string) {
    const invoiceNumber = await this.numbers.nextNumber('INVOICE');
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

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: dto.clientId,
        projectId: dto.projectId,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        title: dto.title,
        notes: dto.notes,
        subtotalHT: new Prisma.Decimal(subtotalHT),
        taxRate: new Prisma.Decimal(taxRate),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalTTC: new Prisma.Decimal(totalTTC),
        remainingAmount: new Prisma.Decimal(totalTTC),
        createdById: actorId,
        items: { create: items },
      },
      include: {
        client: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async createFromQuote(quoteId: string, actorId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, deletedAt: null },
      include: { items: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestException('Only accepted quotes can be converted to invoices');
    }

    const invoiceNumber = await this.numbers.nextNumber('INVOICE');

    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoice.create({
        data: {
          invoiceNumber,
          quoteId: quote.id,
          clientId: quote.clientId,
          projectId: quote.projectId,
          invoiceDate: new Date(),
          title: quote.title,
          notes: quote.notes,
          subtotalHT: quote.subtotalHT,
          taxRate: quote.taxRate,
          taxAmount: quote.taxAmount,
          totalTTC: quote.totalTTC,
          remainingAmount: quote.totalTTC,
          createdById: actorId,
          items: {
            create: quote.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalHT: item.totalHT,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: {
          client: { select: { id: true, name: true } },
          items: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'CONVERTED_TO_INVOICE', updatedById: actorId },
      }),
    ]);

    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto, actorId: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Invoice not found');
    if (existing.status !== 'DRAFT') throw new ConflictException('Only draft invoices can be edited');

    const updateData: any = { updatedById: actorId };
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.invoiceDate !== undefined) updateData.invoiceDate = new Date(dto.invoiceDate);
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
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
      updateData.remainingAmount = new Prisma.Decimal(totalTTC);

      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await this.prisma.invoiceItem.createMany({ data: items.map((i) => ({ ...i, invoiceId: id })) });
    } else if (dto.taxRate !== undefined) {
      const taxRate = dto.taxRate;
      const taxAmount = Number(existing.subtotalHT) * (taxRate / 100);
      updateData.taxRate = new Prisma.Decimal(taxRate);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalTTC = new Prisma.Decimal(Number(existing.subtotalHT) + taxAmount);
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async registerPayment(id: string, dto: RegisterPaymentDto, actorId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new BadRequestException('Cannot pay a cancelled invoice');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice is already fully paid');
    if (!['SENT', 'PARTIALLY_PAID'].includes(invoice.status)) {
      throw new BadRequestException('Only sent invoices can receive payments');
    }

    const amount = new Prisma.Decimal(dto.amount);
    const currentPaid = new Prisma.Decimal(Number(invoice.paidAmount));
    const total = new Prisma.Decimal(Number(invoice.totalTTC));
    const currentRemaining = new Prisma.Decimal(Number(invoice.remainingAmount));
    if (amount.gt(currentRemaining)) {
      throw new BadRequestException('Payment amount cannot exceed the invoice balance');
    }
    const newPaid = currentPaid.plus(amount);
    const remaining = total.minus(newPaid);

    let status = invoice.status;
    if (remaining.isZero()) status = 'PAID' as any;
    else if (remaining.gt(0)) status = 'PARTIALLY_PAID' as any;

    return this.prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          invoiceId: id,
          amount,
          paymentDate: new Date(dto.paymentDate),
          paymentMode: dto.paymentMode as any,
          notes: dto.notes,
          createdById: actorId,
        },
      });
      return tx.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaid,
          remainingAmount: remaining.gt(0) ? remaining : new Prisma.Decimal(0),
          status,
          updatedById: actorId,
        },
        include: {
          payments: {
            where: { deletedAt: null },
            orderBy: { paymentDate: 'desc' },
            select: { id: true, amount: true, paymentDate: true, paymentMode: true, notes: true },
          },
        },
      });
    });
  }

  async transitionStatus(id: string, status: string, actorId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, deletedAt: null } });
    if (!inv) throw new NotFoundException('Invoice not found');

    const transitions: Record<string, string[]> = {
      SENT: ['DRAFT'],
    };

    const allowed = transitions[status];
    if (!allowed || !allowed.includes(inv.status)) {
      throw new BadRequestException(`Cannot transition from ${inv.status} to ${status}`);
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: status as any, updatedById: actorId },
      select: { id: true, invoiceNumber: true, status: true },
    });
  }

  async softDelete(id: string, actorId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, deletedAt: null } });
    if (!inv) throw new NotFoundException('Invoice not found');
    return this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'CANCELLED' as any },
    });
  }

  async restore(id: string, actorId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!inv) throw new NotFoundException('Archived invoice not found');
    return this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: null, deletedById: null, updatedById: actorId, status: 'DRAFT' as any },
    });
  }
}
