import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PropertyQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true } } },
      }),
      this.prisma.property.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, city: true } },
        sales: {
          where: { deletedAt: null },
          include: {
            client: { select: { id: true, name: true } },
            payments: { where: { deletedAt: null }, select: { amount: true } },
          },
        },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    const totalSold = property.sales.reduce(
      (sum, s) => sum + Number(s.salePrice),
      0,
    );
    return { ...property, totalSold };
  }

  async create(dto: CreatePropertyDto, actorId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.property.create({
      data: {
        reference: dto.reference,
        type: dto.type,
        surface: dto.surface,
        projectId: dto.projectId,
        price: dto.price,
        status: dto.status || 'DISPONIBLE',
        notes: dto.notes,
        createdById: actorId,
      },
    });
  }

  async update(id: string, dto: UpdatePropertyDto, actorId: string) {
    await this.findOne(id);
    return this.prisma.property.update({
      where: { id },
      data: { ...dto, updatedById: actorId },
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId },
    });
    return { success: true };
  }
}
