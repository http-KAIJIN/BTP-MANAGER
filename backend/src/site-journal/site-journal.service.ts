import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SiteJournalService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string, date?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = { projectId, deletedAt: null };
    if (date) where.date = new Date(date);

    const [data, total] = await Promise.all([
      this.prisma.siteJournal.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { photos: { take: 3, orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.siteJournal.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async get(id: string) {
    const journal = await this.prisma.siteJournal.findFirst({
      where: { id, deletedAt: null },
      include: {
        photos: { orderBy: { createdAt: 'desc' } },
        attendances: {
          where: { deletedAt: null },
          include: { intervenant: { select: { id: true, name: true, trade: true } } },
        },
      },
    });
    if (!journal) throw new NotFoundException('Journal entry not found');
    return journal;
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.siteJournal.create({
      data: {
        projectId: data.projectId as string,
        date: new Date(data.date as string) || new Date(),
        weather: (data.weather as string) || null,
        progress: (data.progress as number) || 0,
        summary: (data.summary as string) || null,
        workPerformed: (data.workPerformed as string) || null,
        problems: (data.problems as string) || null,
        decisions: (data.decisions as string) || null,
        nextActions: (data.nextActions as string) || null,
        notes: (data.notes as string) || null,
      },
      include: { photos: true },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.get(id);
    const updateData: Record<string, unknown> = {};
    const fields = ['weather', 'progress', 'summary', 'workPerformed', 'problems', 'decisions', 'nextActions', 'notes'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.date) updateData.date = new Date(data.date as string);

    return this.prisma.siteJournal.update({
      where: { id },
      data: updateData,
      include: { photos: true },
    });
  }

  async delete(id: string) {
    await this.get(id);
    await this.prisma.siteJournal.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
