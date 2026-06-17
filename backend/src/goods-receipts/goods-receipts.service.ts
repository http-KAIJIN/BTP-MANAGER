import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NumbersService } from '../numbers/numbers.service';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';
import { GoodsReceiptQueryDto } from './dto/goods-receipt-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoodsReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumbersService,
  ) {}

  async findAll(query: GoodsReceiptQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.GoodsReceiptWhereInput = {
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true } },
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.goodsReceipt.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const receipt = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderNumber: true, supplierId: true, status: true } },
        project: { select: { id: true, name: true, city: true } },
        createdBy: { select: { id: true, fullName: true } },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            orderItem: { select: { id: true, quantity: true, receivedQty: true } },
            material: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    });
    if (!receipt) throw new NotFoundException('Goods receipt not found');
    return receipt;
  }

  async create(dto: CreateGoodsReceiptDto, actorId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.orderId, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'APPROVED') {
      throw new BadRequestException('Only approved purchase orders can receive goods');
    }

    const orderItemMap = new Map(po.items.map((i) => [i.id, i]));
    const receiptNumber = await this.numbers.nextNumber('GOODS_RECEIPT');

    const receiptItems = dto.items.map((item, idx) => {
      const orderItem = orderItemMap.get(item.orderItemId);
      if (!orderItem) throw new NotFoundException(`Order item ${item.orderItemId} not found`);

      const qtyReceived = new Prisma.Decimal(item.qtyReceived);
      const remainingQty = new Prisma.Decimal(orderItem.quantity).minus(orderItem.receivedQty);
      if (qtyReceived.gt(remainingQty)) {
        throw new BadRequestException(
          `Cannot receive ${qtyReceived.toString()} for ${orderItem.description}. Remaining quantity is ${remainingQty.toString()}`,
        );
      }
      const unitPrice = orderItem.unitPrice;
      const totalHT = qtyReceived.mul(unitPrice);

      return {
        orderItemId: item.orderItemId,
        materialId: orderItem.materialId,
        description: orderItem.description,
        qtyOrdered: orderItem.quantity,
        qtyReceived,
        unitPrice,
        totalHT,
        sortOrder: idx,
      };
    });

    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber,
          orderId: dto.orderId,
          projectId: dto.projectId ?? po.projectId,
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          supplierRef: dto.supplierRef ?? null,
          notes: dto.notes ?? null,
          createdById: actorId,
          items: { create: receiptItems },
        },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });

      for (const item of receiptItems) {
        await tx.purchaseOrderItem.update({
          where: { id: item.orderItemId },
          data: { receivedQty: { increment: item.qtyReceived } },
        });
      }

      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { orderId: dto.orderId },
      });

      const allReceived = updatedItems.every(
        (i) => Number(i.receivedQty) >= Number(i.quantity),
      );

      if (allReceived) {
        await tx.purchaseOrder.update({
          where: { id: dto.orderId },
          data: { status: 'RECEIVED' as any },
        });
        await tx.goodsReceipt.update({
          where: { id: receipt.id },
          data: { status: 'COMPLETE' as any },
        });
      }

      const stockMovements = receiptItems
        .filter((item) => item.materialId)
        .map((item) => ({
          materialId: item.materialId!,
          projectId: po.projectId,
          type: 'IN' as any,
          quantity: item.qtyReceived,
          unitPrice: item.unitPrice,
          totalCost: item.totalHT,
          reference: receiptNumber,
          notes: `Goods receipt ${receiptNumber} - ${item.description}`,
          createdById: actorId,
        }));

      if (stockMovements.length > 0) {
        await tx.stockMovement.createMany({ data: stockMovements });
        for (const movement of stockMovements) {
          await tx.materialCatalog.update({
            where: { id: movement.materialId },
            data: { currentQty: { increment: movement.quantity } },
          });
        }
      }

      return this.findOne(receipt.id);
    });
  }

  async update(id: string, dto: UpdateGoodsReceiptDto, actorId: string) {
    const existing = await this.prisma.goodsReceipt.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Goods receipt not found');

    const updateData: any = {};
    if (dto.receiptDate !== undefined) updateData.receiptDate = new Date(dto.receiptDate);
    if (dto.supplierRef !== undefined) updateData.supplierRef = dto.supplierRef;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (Object.keys(updateData).length === 0) return this.findOne(id);

    await this.prisma.goodsReceipt.update({ where: { id }, data: updateData });

    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const receipt = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!receipt) throw new NotFoundException('Goods receipt not found');

    return this.prisma.$transaction(async (tx) => {
      for (const item of receipt.items) {
        if (!item.materialId) continue;
        const material = await tx.materialCatalog.findUnique({
          where: { id: item.materialId },
          select: { currentQty: true, name: true },
        });
        if (!material) continue;
        if (new Prisma.Decimal(material.currentQty).lt(item.qtyReceived)) {
          throw new BadRequestException(
            `Cannot delete receipt because stock for ${material.name} is below the received quantity`,
          );
        }
      }

      for (const item of receipt.items) {
        await tx.purchaseOrderItem.update({
          where: { id: item.orderItemId },
          data: { receivedQty: { decrement: item.qtyReceived } },
        });
        if (item.materialId) {
          await tx.materialCatalog.update({
            where: { id: item.materialId },
            data: { currentQty: { decrement: item.qtyReceived } },
          });
        }
      }

      const poItems = await tx.purchaseOrderItem.findMany({
        where: { orderId: receipt.orderId },
      });

      const anyReceived = poItems.some((i) => Number(i.receivedQty) > 0);
      if (!anyReceived) {
        await tx.purchaseOrder.update({
          where: { id: receipt.orderId },
          data: { status: 'APPROVED' as any },
        });
      }

      await tx.stockMovement.deleteMany({
        where: { reference: receipt.receiptNumber },
      });

      await tx.goodsReceiptItem.deleteMany({ where: { receiptId: id } });
      await tx.goodsReceipt.delete({ where: { id } });

      return { deleted: true, id };
    });
  }

  async findByOrder(orderId: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { orderId },
      orderBy: { receiptDate: 'desc' },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }
}
