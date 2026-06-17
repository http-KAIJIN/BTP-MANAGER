import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string, page = 1) {
    const limit = 20;
    const [data, total] = await Promise.all([
      this.prisma.materialUsage.findMany({
        where: { projectId, deletedAt: null },
        orderBy: { usageDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.materialUsage.count({ where: { projectId, deletedAt: null } }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.materialUsage.create({
      data: {
        projectId: data.projectId as string,
        materialName: data.materialName as string,
        quantity: Number(data.quantity) || 0,
        unit: data.unit as string,
        cost: Number(data.cost) || 0,
        supplierId: (data.supplierId as string) || null,
        usageDate: new Date((data.usageDate as string) || Date.now()),
        notes: (data.notes as string) || null,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.get(id);
    const updateData: Record<string, unknown> = {};
    const fields = ['materialName', 'quantity', 'unit', 'cost', 'supplierId', 'usageDate', 'notes'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.quantity) updateData.quantity = Number(data.quantity);
    if (data.cost) updateData.cost = Number(data.cost);
    if (data.usageDate) updateData.usageDate = new Date(data.usageDate as string);

    return this.prisma.materialUsage.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    await this.get(id);
    await this.prisma.materialUsage.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async reports(projectId: string) {
    const [byMaterial, bySupplier, totalAgg] = await Promise.all([
      this.prisma.materialUsage.groupBy({
        by: ['materialName'],
        where: { projectId, deletedAt: null },
        _sum: { quantity: true, cost: true },
        orderBy: { _sum: { cost: 'desc' } },
      }),
      this.prisma.materialUsage.groupBy({
        by: ['supplierId'],
        where: { projectId, deletedAt: null, supplierId: { not: null } },
        _sum: { cost: true },
        orderBy: { _sum: { cost: 'desc' } },
      }),
      this.prisma.materialUsage.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { cost: true, quantity: true },
        _count: true,
      }),
    ]);

    return {
      totalCost: Number(totalAgg._sum.cost || 0),
      totalQuantity: Number(totalAgg._sum.quantity || 0),
      totalEntries: totalAgg._count,
      byMaterial: byMaterial.map((m) => ({
        material: m.materialName,
        quantity: Number(m._sum.quantity || 0),
        cost: Number(m._sum.cost || 0),
      })),
      bySupplier: bySupplier.map((s) => ({
        supplierId: s.supplierId,
        cost: Number(s._sum.cost || 0),
      })),
    };
  }

  private async get(id: string) {
    const item = await this.prisma.materialUsage.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Material usage not found');
    return item;
  }
}
