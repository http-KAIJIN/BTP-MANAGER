import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ClientQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.ClientWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { cin: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.client.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.client.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  create(dto: CreateClientDto, actorId: string) {
    return this.prisma.client.create({
      data: { ...dto, createdById: actorId },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        projects: {
          where: { deletedAt: null },
          select: { id: true, name: true, city: true, status: true },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, actorId: string) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: { ...dto, updatedById: actorId },
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId },
    });
    return { success: true };
  }

  async getFinancialSummary(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      include: {
        projects: {
          where: { deletedAt: null },
          include: {
            payments: { where: { deletedAt: null }, select: { amount: true } },
          },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');

    let totalPayments = 0;
    let projectCount = client.projects.length;

    for (const project of client.projects) {
      for (const payment of project.payments) {
        totalPayments += Number(payment.amount);
      }
    }

    return {
      clientId,
      totalProjects: projectCount,
      totalPayments,
    };
  }
}
