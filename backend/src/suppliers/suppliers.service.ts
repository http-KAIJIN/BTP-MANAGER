import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SupplierQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.SupplierWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.category
        ? { category: { contains: query.category, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  create(dto: CreateSupplierDto, actorId: string) {
    return this.prisma.supplier.create({
      data: { ...dto, createdById: actorId },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, actorId: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { ...dto, updatedById: actorId },
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'ARCHIVED' },
    });
    return { success: true };
  }

  async restore(id: string, actorId: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return this.prisma.supplier.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        status: 'ACTIVE',
        updatedById: actorId,
      },
    });
  }
}
