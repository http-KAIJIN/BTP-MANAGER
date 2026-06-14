import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { CompanyQueryDto } from './dto/company-query.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CompanyQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.CompanyWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.managerName
        ? { managerName: { contains: query.managerName, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { ice: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.company.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async create(dto: CreateCompanyDto, actorId: string) {
    await this.ensureUniqueIce(dto.ice);
    return this.prisma.company.create({
      data: { ...dto, createdById: actorId },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, actorId: string) {
    await this.findOne(id);
    await this.ensureUniqueIce(dto.ice, id);
    return this.prisma.company.update({
      where: { id },
      data: { ...dto, updatedById: actorId },
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'ARCHIVED' },
    });
    return { success: true };
  }

  async restore(id: string, actorId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.company.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        status: 'ACTIVE',
        updatedById: actorId,
      },
    });
  }

  private async ensureUniqueIce(ice?: string, ignoreId?: string) {
    if (!ice) return;
    const existing = await this.prisma.company.findUnique({ where: { ice } });
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException('Company ICE is already used');
    }
  }
}
