import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SaleQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { saleDate: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          property: { select: { id: true, reference: true, type: true } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        property: {
          select: { id: true, reference: true, type: true, surface: true, price: true },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingBalance = Number(sale.salePrice) - totalPaid;
    return { ...sale, totalPaid, remainingBalance };
  }

  async create(dto: CreateSaleDto, actorId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, deletedAt: null } });
    if (!client) throw new NotFoundException('Client not found');
    const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, deletedAt: null } });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.sale.create({
      data: {
        clientId: dto.clientId,
        propertyId: dto.propertyId,
        salePrice: dto.salePrice,
        downPayment: dto.downPayment || 0,
        saleDate: dto.saleDate ? new Date(dto.saleDate) : new Date(),
        notes: dto.notes,
        createdById: actorId,
      },
    });
  }

  async update(id: string, dto: UpdateSaleDto, actorId: string) {
    await this.findOne(id);
    return this.prisma.sale.update({
      where: { id },
      data: { ...dto, updatedById: actorId },
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.sale.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId },
    });
    return { success: true };
  }

  // Payments
  async createPayment(saleId: string, dto: CreateSalePaymentDto, actorId: string) {
    const sale = await this.prisma.sale.findFirst({ where: { id: saleId, deletedAt: null } });
    if (!sale) throw new NotFoundException('Sale not found');
    return this.prisma.salePayment.create({
      data: {
        saleId,
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        notes: dto.notes,
        createdById: actorId,
      },
    });
  }

  async findPayments(saleId: string) {
    const sale = await this.prisma.sale.findFirst({ where: { id: saleId, deletedAt: null } });
    if (!sale) throw new NotFoundException('Sale not found');
    return this.prisma.salePayment.findMany({
      where: { saleId, deletedAt: null },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async deletePayment(saleId: string, paymentId: string) {
    const payment = await this.prisma.salePayment.findFirst({
      where: { id: paymentId, saleId, deletedAt: null },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.prisma.salePayment.update({
      where: { id: paymentId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
