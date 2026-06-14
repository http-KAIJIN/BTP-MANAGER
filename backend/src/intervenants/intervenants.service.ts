import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { CreateIntervenantDto } from './dto/create-intervenant.dto';
import { IntervenantQueryDto } from './dto/intervenant-query.dto';
import { UpdateIntervenantDto } from './dto/update-intervenant.dto';

@Injectable()
export class IntervenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IntervenantQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.IntervenantWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.trade
        ? { trade: { contains: query.trade, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { trade: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.intervenant.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.intervenant.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  create(dto: CreateIntervenantDto, actorId: string) {
    return this.prisma.intervenant.create({
      data: { ...dto, createdById: actorId },
    });
  }

  async findOne(id: string) {
    const intervenant = await this.prisma.intervenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!intervenant) throw new NotFoundException('Intervenant not found');
    return intervenant;
  }

  async update(id: string, dto: UpdateIntervenantDto, actorId: string) {
    await this.findOne(id);
    return this.prisma.intervenant.update({
      where: { id },
      data: { ...dto, updatedById: actorId },
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.intervenant.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'ARCHIVED' },
    });
    return { success: true };
  }

  async restore(id: string, actorId: string) {
    const intervenant = await this.prisma.intervenant.findUnique({
      where: { id },
    });
    if (!intervenant) throw new NotFoundException('Intervenant not found');
    return this.prisma.intervenant.update({
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
