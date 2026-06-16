import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectOwnershipType } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type ProjectWriteDto = CreateProjectDto | UpdateProjectDto;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProjectQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const ownershipType = query.ownershipType
      ? this.normalizeOwnershipType(query.ownershipType)
      : undefined;
    const where: Prisma.ProjectWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.city
        ? { city: { contains: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.ownerCompanyId ? { ownerCompanyId: query.ownerCompanyId } : {}),
      ...(query.executingCompanyId
        ? { executingCompanyId: query.executingCompanyId }
        : {}),
      ...(ownershipType ? { ownershipType } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
              { projectType: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { ownerCompany: true, executingCompany: true },
      }),
      this.prisma.project.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async create(dto: CreateProjectDto, actorId: string) {
    const data = await this.buildProjectData(dto);
    return this.prisma.project.create({
      data: { ...data, createdById: actorId },
      include: { ownerCompany: true, executingCompany: true },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { ownerCompany: true, executingCompany: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, actorId: string) {
    const existing = await this.findOne(id);
    const data = await this.buildProjectData({
      ...existing,
      ...dto,
    } as CreateProjectDto);
    return this.prisma.project.update({
      where: { id },
      data: { ...data, updatedById: actorId },
      include: { ownerCompany: true, executingCompany: true },
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'ARCHIVED' },
    });
    return { success: true };
  }

  async restore(id: string, actorId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        status: 'ACTIVE',
        updatedById: actorId,
      },
      include: { ownerCompany: true, executingCompany: true },
    });
  }

  private async buildProjectData(
    dto: ProjectWriteDto,
  ): Promise<Prisma.ProjectUncheckedCreateInput> {
    if (!dto.name) {
      throw new BadRequestException('Project name is required');
    }

    return {
      name: dto.name,
      description: dto.description || null,
      address: dto.address || null,
      city: dto.city || '',
      startDate: dto.startDate
        ? this.toDate(dto.startDate)
        : new Date(),
      expectedEndDate: dto.expectedEndDate
        ? this.toDate(dto.expectedEndDate)
        : undefined,
      projectType: dto.projectType || null,
      ownershipType: dto.ownershipType
        ? this.normalizeOwnershipType(dto.ownershipType)
        : undefined,
      ownerCompanyId: dto.ownerCompanyId || null,
      externalClientName: dto.externalClientName || null,
      externalClientPhone: dto.externalClientPhone || null,
      externalClientCompany: dto.externalClientCompany || null,
      executingCompanyId: dto.executingCompanyId || null,
      notes: dto.notes || null,
    };
  }

  private normalizeOwnershipType(value?: string): ProjectOwnershipType {
    if (!value) return 'INTERNAL_COMPANY';
    if (value === 'internal_company' || value === 'INTERNAL_COMPANY')
      return 'INTERNAL_COMPANY';
    if (value === 'external_client' || value === 'EXTERNAL_CLIENT')
      return 'EXTERNAL_CLIENT';
    return 'INTERNAL_COMPANY';
  }

  private toDate(value: string | Date | undefined, requiredMessage?: string) {
    if (!value)
      throw new BadRequestException(requiredMessage ?? 'Invalid date');
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Invalid date');
    return date;
  }
}
