import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateConstructionPhaseDto } from './dto/update-phase.dto';

const DEFAULT_PHASES = [
  'Études',
  'Terrassement',
  'Fondations',
  'Sous-sol',
  'RDC',
  'R+1',
  'R+2',
  'R+3',
  'R+4',
  'R+5',
  'Toiture',
  'Gros œuvre',
  'Électricité',
  'Plomberie',
  'Aluminium',
  'Marbre',
  'Ascenseur',
  'Finitions',
  'Réception',
];

@Injectable()
export class ConstructionService {
  constructor(private readonly prisma: PrismaService) {}

  async getPhases(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');

    const phases = await this.prisma.constructionPhase.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const phaseMap = new Map(phases.map((p) => [p.name, p]));
    const allPhases = DEFAULT_PHASES.map((name) => {
      const phase = phaseMap.get(name);
      return phase
        ? {
            id: phase.id,
            projectId: phase.projectId,
            name: phase.name,
            status: phase.status.toLowerCase(),
            startDate: phase.startDate?.toISOString() ?? null,
            endDate: phase.endDate?.toISOString() ?? null,
            progress: phase.progress,
            notes: phase.notes,
            createdAt: phase.createdAt,
          }
        : {
            id: null,
            projectId,
            name,
            status: 'not_started',
            startDate: null,
            endDate: null,
            progress: 0,
            notes: null,
            createdAt: null,
          };
    });

    const globalProgress = Math.round(
      allPhases.reduce((sum, p) => sum + p.progress, 0) / allPhases.length,
    );

    return { phases: allPhases, globalProgress };
  }

  async updatePhase(
    projectId: string,
    phaseName: string,
    dto: UpdateConstructionPhaseDto,
    actorId: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');

    const existing = await this.prisma.constructionPhase.findFirst({
      where: { projectId, name: phaseName, deletedAt: null },
    });

    const data: Record<string, unknown> = { updatedById: actorId };
    if (dto.status !== undefined) data.status = dto.status.toUpperCase();
    if (dto.startDate !== undefined)
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.progress !== undefined) data.progress = dto.progress;
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (existing) {
      return this.prisma.constructionPhase.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.constructionPhase.create({
      data: {
        projectId,
        name: phaseName,
        status: (dto.status ?? 'not_started').toUpperCase() as
          | 'NOT_STARTED'
          | 'IN_PROGRESS'
          | 'COMPLETED',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        progress: dto.progress ?? 0,
        notes: dto.notes ?? null,
        createdById: actorId,
      },
    });
  }

  async getProjectGlobalProgress(projectId: string) {
    const result = await this.getPhases(projectId);
    return { projectId, globalProgress: result.globalProgress };
  }
}
