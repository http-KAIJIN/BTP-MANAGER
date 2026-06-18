import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { ConsumeMaterialDto } from './dto/consume-material.dto';
import { CreateMaterialCatalogDto } from './dto/create-material-catalog.dto';
import { CreateMaterialCategoryDto } from './dto/create-material-category.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { UpdateMaterialCatalogDto } from './dto/update-material-catalog.dto';
import { UpdateMaterialCategoryDto } from './dto/update-material-category.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ───────────────────────────────────────────────────────

  async findAllCategories() {
    return this.prisma.materialCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(dto: CreateMaterialCategoryDto) {
    return this.prisma.materialCategory.create({ data: dto });
  }

  async updateCategory(id: string, dto: UpdateMaterialCategoryDto) {
    const category = await this.prisma.materialCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.materialCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.materialCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');
    const materialCount = await this.prisma.materialCatalog.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (materialCount > 0) {
      await this.prisma.materialCategory.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true };
    }
    await this.prisma.materialCategory.delete({ where: { id } });
    return { success: true };
  }

  // ─── Materials ────────────────────────────────────────────────────────

  async findAllMaterials(query: MaterialQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.MaterialCatalogWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.materialCatalog.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { category: true },
      }),
      this.prisma.materialCatalog.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOneMaterial(id: string) {
    const material = await this.prisma.materialCatalog.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  createMaterial(dto: CreateMaterialCatalogDto) {
    return this.prisma.materialCatalog.create({
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        unit: dto.unit,
        minQty: dto.minQty ?? 0,
        reorderQty: dto.reorderQty,
        unitPrice: dto.unitPrice,
      },
      include: { category: true },
    });
  }

  async updateMaterial(
    id: string,
    dto: UpdateMaterialCatalogDto,
    actorId?: string,
  ) {
    const material = await this.prisma.materialCatalog.findFirst({
      where: { id, deletedAt: null },
    });
    if (!material) throw new NotFoundException('Material not found');

    if (dto.currentQty !== undefined && dto.currentQty !== Number(material.currentQty)) {
      const diff = dto.currentQty - Number(material.currentQty);
      await this.prisma.stockMovement.create({
        data: {
          materialId: id,
          type: StockMovementType.ADJUSTMENT,
          quantity: Math.abs(diff),
          unitPrice: material.unitPrice,
          totalCost: material.unitPrice
            ? new Prisma.Decimal(Number(material.unitPrice) * Math.abs(diff))
            : null,
          notes: dto.currentQty !== undefined
            ? `Auto-adjustment from ${material.currentQty} to ${dto.currentQty}`
            : undefined,
          createdById: actorId,
        },
      });
    }

    const { currentQty, ...updateData } = dto;
    return this.prisma.materialCatalog.update({
      where: { id },
      data: { ...updateData, currentQty: dto.currentQty },
      include: { category: true },
    });
  }

  async softDeleteMaterial(id: string) {
    const material = await this.prisma.materialCatalog.findFirst({
      where: { id, deletedAt: null },
    });
    if (!material) throw new NotFoundException('Material not found');
    await this.prisma.materialCatalog.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true };
  }

  async restoreMaterial(id: string) {
    const material = await this.prisma.materialCatalog.findUnique({
      where: { id },
    });
    if (!material) throw new NotFoundException('Material not found');
    return this.prisma.materialCatalog.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: { category: true },
    });
  }

  // ─── Movements ────────────────────────────────────────────────────────

  async findAllMovements(query: StockQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.StockMovementWhereInput = {
      ...(query.materialId ? { materialId: query.materialId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          material: { select: { id: true, name: true, unit: true } },
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async createMovement(dto: CreateStockMovementDto, actorId?: string) {
    const material = await this.prisma.materialCatalog.findFirst({
      where: { id: dto.materialId, deletedAt: null },
    });
    if (!material) throw new NotFoundException('Material not found');

    const qty = new Prisma.Decimal(dto.quantity);
    const unitPrice = dto.unitPrice
      ? new Prisma.Decimal(dto.unitPrice)
      : material.unitPrice
        ? new Prisma.Decimal(Number(material.unitPrice))
        : null;
    const totalCost = unitPrice ? unitPrice.mul(qty) : null;

    if (dto.type === StockMovementType.OUT || dto.type === StockMovementType.TRANSFER) {
      if (Number(material.currentQty) < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${material.currentQty}, requested: ${dto.quantity}`,
        );
      }
    }

    const movement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockMovement.create({
        data: {
          materialId: dto.materialId,
          projectId: dto.projectId,
          type: dto.type,
          quantity: qty,
          unitPrice,
          totalCost,
          reference: dto.reference,
          notes: dto.notes,
          createdById: actorId,
        },
        include: {
          material: { select: { id: true, name: true, unit: true } },
          project: { select: { id: true, name: true } },
        },
      });
      const incoming = dto.type === StockMovementType.IN || dto.type === StockMovementType.ADJUSTMENT;
      const updateResult = incoming
        ? await tx.materialCatalog.updateMany({
            where: { id: dto.materialId, deletedAt: null },
            data: { currentQty: { increment: qty } },
          })
        : await tx.materialCatalog.updateMany({
            where: { id: dto.materialId, deletedAt: null, currentQty: { gte: qty } },
            data: { currentQty: { decrement: qty } },
          });
      if (updateResult.count !== 1) {
        throw new BadRequestException('Insufficient stock for this movement');
      }
      return created;
    });

    return movement;
  }

  // ─── Dashboard ────────────────────────────────────────────────────────

  async getDashboard() {
    const activeWhere: Prisma.MaterialCatalogWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    const [allMaterials, mostUsed] = await Promise.all([
      this.prisma.materialCatalog.findMany({
        where: activeWhere,
        orderBy: { name: 'asc' },
      }),
      this.prisma.stockMovement.groupBy({
        by: ['materialId'],
        where: {
          type: StockMovementType.OUT,
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    const lowStockList = allMaterials
      .filter((m) => {
        const qty = Number(m.currentQty);
        const min = Number(m.minQty);
        return min > 0 && qty <= min;
      })
      .map((m) => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        currentQty: Number(m.currentQty),
        minQty: Number(m.minQty),
        unitPrice: Number(m.unitPrice || 0),
      }));

    const totalStockValue = allMaterials.reduce(
      (sum, m) => sum + Number(m.currentQty) * Number(m.unitPrice || 0),
      0,
    );

    const mostUsedMaterials =
      mostUsed.length > 0
        ? await Promise.all(
            mostUsed.map(async (g) => {
              const mat = await this.prisma.materialCatalog.findUnique({
                where: { id: g.materialId },
                select: { id: true, name: true, unit: true },
              });
              return {
                materialId: g.materialId,
                materialName: mat?.name ?? 'Unknown',
                unit: mat?.unit ?? '',
                totalConsumed: Number(g._sum.quantity),
              };
            }),
          )
        : [];

    return {
      lowStockCount: lowStockList.length,
      totalStockValue,
      lowStockItems: lowStockList,
      mostUsedMaterials,
    };
  }

  // ─── Consume ──────────────────────────────────────────────────────────

  async consume(dto: ConsumeMaterialDto, actorId?: string) {
    const material = await this.prisma.materialCatalog.findFirst({
      where: { id: dto.materialId, deletedAt: null },
    });
    if (!material) throw new NotFoundException('Material not found');

    if (Number(material.currentQty) < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${material.currentQty}, requested: ${dto.quantity}`,
      );
    }

    const qty = new Prisma.Decimal(dto.quantity);
    const unitPrice = material.unitPrice
      ? new Prisma.Decimal(Number(material.unitPrice))
      : new Prisma.Decimal(0);
    const cost = unitPrice.mul(qty);

    const movement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockMovement.create({
        data: {
          materialId: dto.materialId,
          projectId: dto.projectId,
          type: StockMovementType.OUT,
          quantity: qty,
          unitPrice,
          totalCost: cost,
          notes: dto.notes,
          createdById: actorId,
        },
        include: {
          material: { select: { id: true, name: true, unit: true } },
          project: { select: { id: true, name: true } },
        },
      });
      const updateResult = await tx.materialCatalog.updateMany({
        where: { id: dto.materialId, deletedAt: null, currentQty: { gte: qty } },
        data: { currentQty: { decrement: qty } },
      });
      if (updateResult.count !== 1) {
        throw new BadRequestException('Insufficient stock for this consumption');
      }
      await tx.materialUsage.create({
        data: {
          projectId: dto.projectId,
          materialId: dto.materialId,
          materialName: material.name,
          quantity: qty,
          unit: material.unit,
          cost,
          usageDate: new Date(),
          notes: dto.notes,
        },
      });
      return created;
    });

    return movement;
  }
}
