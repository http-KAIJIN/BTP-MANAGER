import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: {
          where: { deletedAt: null, permission: { deletedAt: null } },
          include: { permission: true },
        },
      },
    });
  }
}
