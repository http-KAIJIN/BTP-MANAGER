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
    const ownershipType = this.normalizeOwnershipType(dto.ownershipType);
    const startDate = this.toDate(dto.startDate, 'Start date is required');
    const expectedEndDate = dto.expectedEndDate
      ? this.toDate(dto.expectedEndDate)
      : undefined;

    if (!dto.name) {
      throw new BadRequestException('Project name is required');
    }

    if (!dto.city) {
      throw new BadRequestException('City is required');
    }

    if (expectedEndDate && expectedEndDate < startDate) {
      throw new BadRequestException(
        'Expected end date cannot be before start date',
      );
    }

    if (!dto.executingCompanyId) {
      throw new BadRequestException('Executing company is required');
    }

    await this.ensureCompanyExists(
      dto.executingCompanyId,
      'Executing company not found',
    );

    if (ownershipType === 'INTERNAL_COMPANY') {
      if (!dto.ownerCompanyId) {
        throw new BadRequestException(
          'Owner company is required for internal company projects',
        );
      }
      await this.ensureCompanyExists(
        dto.ownerCompanyId,
        'Owner company not found',
      );
    }

    if (ownershipType === 'EXTERNAL_CLIENT' && !dto.externalClientName) {
      throw new BadRequestException(
        'External client name is required for external client projects',
      );
    }

    return {
      name: dto.name,
      description: dto.description,
      address: dto.address,
      city: dto.city,
      startDate,
      expectedEndDate,
      projectType: dto.projectType,
      ownershipType,
      ownerCompanyId:
        ownershipType === 'INTERNAL_COMPANY' ? dto.ownerCompanyId : null,
      externalClientName:
        ownershipType === 'EXTERNAL_CLIENT' ? dto.externalClientName : null,
      externalClientPhone:
        ownershipType === 'EXTERNAL_CLIENT' ? dto.externalClientPhone : null,
      externalClientCompany:
        ownershipType === 'EXTERNAL_CLIENT' ? dto.externalClientCompany : null,
      executingCompanyId: dto.executingCompanyId,
      notes: dto.notes,
    };
  }

  private normalizeOwnershipType(value?: string): ProjectOwnershipType {
    if (value === 'internal_company' || value === 'INTERNAL_COMPANY')
      return 'INTERNAL_COMPANY';
    if (value === 'external_client' || value === 'EXTERNAL_CLIENT')
      return 'EXTERNAL_CLIENT';
    throw new BadRequestException(
      'Ownership type must be internal_company or external_client',
    );
  }

  private toDate(value: string | Date | undefined, requiredMessage?: string) {
    if (!value)
      throw new BadRequestException(requiredMessage ?? 'Invalid date');
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Invalid date');
    return date;
  }

  private async ensureCompanyExists(id: string, message: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
    });
    if (!company) throw new BadRequestException(message);
  }
}
