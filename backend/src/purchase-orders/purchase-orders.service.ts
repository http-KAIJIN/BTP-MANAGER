import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NumbersService } from '../numbers/numbers.service';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumbersService,
  ) {}

  async findAll(query: PurchaseOrderQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
              { title: { contains: query.search, mode: 'insensitive' } },
              { supplier: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PurchaseOrderOrderByWithRelationInput[] = [];
    if (query.sortBy === 'supplier') {
      orderBy.push({ supplier: { name: query.sortOrder } });
    } else {
      orderBy.push({ [query.sortBy || 'createdAt']: query.sortOrder || 'desc' });
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          _count: { select: { items: true, receipts: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        project: { select: { id: true, name: true, city: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, actorId: string) {
    const orderNumber = await this.numbers.nextNumber('PURCHASE_ORDER');
    const items = dto.items.map((item, idx) => ({
      description: item.description,
      quantity: new Prisma.Decimal(item.quantity),
      unitPrice: new Prisma.Decimal(item.unitPrice),
      totalHT: new Prisma.Decimal(item.quantity * item.unitPrice),
      sortOrder: idx,
      ...(item.materialId ? { materialId: item.materialId } : {}),
    }));
    const subtotalHT = items.reduce((s, i) => s + Number(i.totalHT), 0);
    const taxRate = dto.taxRate ?? 0;
    const taxAmount = subtotalHT * (taxRate / 100);
    const totalTTC = subtotalHT + taxAmount;

    return this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: dto.supplierId,
        projectId: dto.projectId,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
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
        supplier: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto, actorId: string) {
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Purchase order not found');
    if (existing.status !== 'DRAFT') throw new ConflictException('Only draft purchase orders can be edited');

    const updateData: any = { updatedById: actorId };
    if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.orderDate !== undefined) updateData.orderDate = new Date(dto.orderDate);
    if (dto.expectedDate !== undefined) updateData.expectedDate = dto.expectedDate ? new Date(dto.expectedDate) : null;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.items) {
      const items = dto.items.map((item, idx) => ({
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(item.unitPrice),
        totalHT: new Prisma.Decimal(item.quantity * item.unitPrice),
        sortOrder: idx,
        materialId: item.materialId ?? null,
      }));
      const subtotalHT = items.reduce((s, i) => s + Number(i.totalHT), 0);
      const taxRate = dto.taxRate ?? Number(existing.taxRate);
      const taxAmount = subtotalHT * (taxRate / 100);
      const totalTTC = subtotalHT + taxAmount;
      updateData.subtotalHT = new Prisma.Decimal(subtotalHT);
      updateData.taxRate = new Prisma.Decimal(taxRate);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalTTC = new Prisma.Decimal(totalTTC);

      await this.prisma.purchaseOrderItem.deleteMany({ where: { orderId: id } });
      await this.prisma.purchaseOrderItem.createMany({ data: items.map((i) => ({ ...i, orderId: id })) });
    } else if (dto.taxRate !== undefined) {
      const taxRate = dto.taxRate;
      const taxAmount = Number(existing.subtotalHT) * (taxRate / 100);
      updateData.taxRate = new Prisma.Decimal(taxRate);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalTTC = new Prisma.Decimal(Number(existing.subtotalHT) + taxAmount);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async transitionStatus(id: string, status: string, actorId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
    if (!po) throw new NotFoundException('Purchase order not found');

    const transitions: Record<string, string[]> = {
      SENT: ['DRAFT'],
      APPROVED: ['SENT'],
      CANCELLED: ['DRAFT', 'SENT', 'APPROVED'],
    };

    const allowed = transitions[status];
    if (!allowed || !allowed.includes(po.status)) {
      throw new BadRequestException(`Cannot transition from ${po.status} to ${status}`);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any, updatedById: actorId },
      select: { id: true, orderNumber: true, status: true },
    });
  }

  async softDelete(id: string, actorId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'CANCELLED' as any },
    });
  }

  async restore(id: string, actorId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!po) throw new NotFoundException('Archived purchase order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: null, deletedById: null, updatedById: actorId, status: 'DRAFT' as any },
    });
  }

  async generatePdf(id: string): Promise<Buffer> {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
    if (!po) throw new NotFoundException('Purchase order not found');
    // Placeholder — PDF generation coming soon
    return Buffer.from('Purchase Order PDF generation coming soon');
  }
}
