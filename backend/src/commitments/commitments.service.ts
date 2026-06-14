import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BeneficiaryType, Prisma } from '@prisma/client';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { FinancialService } from '../financial/financial.service';
import { CommitmentQueryDto } from './dto/commitment-query.dto';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@Injectable()
export class CommitmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialService: FinancialService,
  ) {}

  async findAll(query: CommitmentQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const beneficiaryType = query.beneficiaryType
      ? this.normalizeBeneficiaryType(query.beneficiaryType)
      : undefined;
    const where: Prisma.CommitmentWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(beneficiaryType ? { beneficiaryType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' } },
              {
                project: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                supplier: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                intervenant: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.commitment.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { project: true, supplier: true, intervenant: true },
      }),
      this.prisma.commitment.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async create(dto: CreateCommitmentDto, actorId: string) {
    const data = await this.buildData(dto);
    return this.prisma.commitment.create({
      data: { ...data, createdById: actorId },
      include: { project: true, supplier: true, intervenant: true },
    });
  }

  async findOne(id: string) {
    const commitment = await this.prisma.commitment.findFirst({
      where: { id, deletedAt: null },
      include: { project: true, supplier: true, intervenant: true },
    });
    if (!commitment) throw new NotFoundException('Commitment not found');
    return commitment;
  }

  async update(id: string, dto: UpdateCommitmentDto, actorId: string) {
    const existing = await this.findOne(id);
    const data = await this.buildData({
      ...existing,
      ...dto,
      commitmentDate:
        dto.commitmentDate ?? existing.commitmentDate.toISOString(),
    } as CreateCommitmentDto);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.commitment.update({
        where: { id },
        data: { ...data, updatedById: actorId },
        include: { project: true, supplier: true, intervenant: true },
      });
      await this.financialService.refreshCommitmentStatus(id, tx);
      return updated;
    });
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.commitment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: actorId,
        status: 'CANCELLED',
      },
    });
    return { success: true };
  }

  async restore(id: string, actorId: string) {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id },
    });
    if (!commitment) throw new NotFoundException('Commitment not found');
    return this.prisma.$transaction(async (tx) => {
      await tx.commitment.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, updatedById: actorId },
      });
      await this.financialService.refreshCommitmentStatus(id, tx);
      return tx.commitment.findUnique({
        where: { id },
        include: { project: true, supplier: true, intervenant: true },
      });
    });
  }

  private async buildData(
    dto: CreateCommitmentDto,
  ): Promise<Prisma.CommitmentUncheckedCreateInput> {
    const beneficiaryType = this.normalizeBeneficiaryType(dto.beneficiaryType);
    if (!dto.projectId) throw new BadRequestException('Project is required');
    if (dto.agreedAmount <= 0)
      throw new BadRequestException('Amount must be greater than 0');
    await this.ensureProject(dto.projectId);
    if (beneficiaryType === 'SUPPLIER') {
      if (!dto.supplierId || dto.intervenantId)
        throw new BadRequestException(
          'Supplier beneficiary is required and intervenant must be empty',
        );
      await this.ensureSupplier(dto.supplierId);
    }
    if (beneficiaryType === 'INTERVENANT') {
      if (!dto.intervenantId || dto.supplierId)
        throw new BadRequestException(
          'Intervenant beneficiary is required and supplier must be empty',
        );
      await this.ensureIntervenant(dto.intervenantId);
    }
    return {
      projectId: dto.projectId,
      beneficiaryType,
      supplierId: beneficiaryType === 'SUPPLIER' ? dto.supplierId : null,
      intervenantId:
        beneficiaryType === 'INTERVENANT' ? dto.intervenantId : null,
      description: dto.description,
      agreedAmount: dto.agreedAmount,
      commitmentDate: new Date(dto.commitmentDate),
      notes: dto.notes,
      status: 'OPEN',
    };
  }

  private normalizeBeneficiaryType(value: string): BeneficiaryType {
    if (value === 'supplier' || value === 'SUPPLIER') return 'SUPPLIER';
    if (value === 'intervenant' || value === 'INTERVENANT')
      return 'INTERVENANT';
    throw new BadRequestException(
      'Beneficiary type must be supplier or intervenant',
    );
  }

  private async ensureProject(id: string) {
    if (
      !(await this.prisma.project.findFirst({ where: { id, deletedAt: null } }))
    )
      throw new BadRequestException('Project not found');
  }
  private async ensureSupplier(id: string) {
    if (
      !(await this.prisma.supplier.findFirst({
        where: { id, deletedAt: null },
      }))
    )
      throw new BadRequestException('Supplier not found');
  }
  private async ensureIntervenant(id: string) {
    if (
      !(await this.prisma.intervenant.findFirst({
        where: { id, deletedAt: null },
      }))
    )
      throw new BadRequestException('Intervenant not found');
  }
}
