import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string, date?: string) {
    const where: Record<string, unknown> = { projectId, deletedAt: null };
    if (date) where.date = new Date(date);

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { intervenant: { select: { id: true, name: true, trade: true } } },
    });
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.attendance.create({
      data: {
        journalId: data.journalId as string,
        projectId: data.projectId as string,
        date: new Date(data.date as string) || new Date(),
        intervenantId: data.intervenantId as string,
        isPresent: data.isPresent !== undefined ? Boolean(data.isPresent) : true,
        hoursWorked: (data.hoursWorked as number) || null,
        dailyCost: (data.dailyCost as number) || null,
      },
      include: { intervenant: { select: { id: true, name: true, trade: true } } },
    });
  }

  async createBatch(projectId: string, date?: string, records?: Record<string, unknown>[]) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    // Find or create a site journal for this date
    let journal = await this.prisma.siteJournal.findFirst({
      where: { projectId, date: new Date(targetDate), deletedAt: null },
    });
    if (!journal) {
      journal = await this.prisma.siteJournal.create({
        data: { projectId, date: new Date(targetDate) },
      });
    }
    const created: Awaited<ReturnType<typeof this.create>>[] = [];
    for (const r of (records || [])) {
      created.push(await this.create({
        ...r,
        projectId,
        date: targetDate,
        journalId: journal.id,
      }));
    }
    return created;
  }

  async update(id: string, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {};
    const fields = ['isPresent', 'hoursWorked', 'dailyCost'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.date) updateData.date = new Date(data.date as string);

    return this.prisma.attendance.update({
      where: { id },
      data: updateData,
      include: { intervenant: { select: { id: true, name: true, trade: true } } },
    });
  }

  async delete(id: string) {
    await this.prisma.attendance.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async dashboard(projectId: string, date?: string) {
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [attendances, projectAgg] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          projectId,
          deletedAt: null,
          date: { gte: today, lt: tomorrow },
        },
        include: { intervenant: { select: { id: true, name: true, trade: true } } },
      }),
      this.prisma.attendance.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { dailyCost: true, hoursWorked: true },
      }),
    ]);

    const presentToday = attendances.filter((a) => a.isPresent);
    const totalDailyCost = attendances.reduce((s, a) => s + Number(a.dailyCost || 0), 0);
    const totalHoursToday = attendances.reduce((s, a) => s + Number(a.hoursWorked || 0), 0);

    return {
      presentToday: presentToday.map((a) => ({
        id: a.id,
        name: a.intervenant.name,
        trade: a.intervenant.trade,
        hoursWorked: Number(a.hoursWorked || 0),
        dailyCost: Number(a.dailyCost || 0),
      })),
      totalWorkersToday: attendances.length,
      totalPresentToday: presentToday.length,
      totalAbsentToday: attendances.length - presentToday.length,
      totalDailyCost,
      totalHoursToday,
      totalProjectCost: Number(projectAgg._sum.dailyCost || 0),
      totalProjectHours: Number(projectAgg._sum.hoursWorked || 0),
      date: today.toISOString().slice(0, 10),
    };
  }
}
