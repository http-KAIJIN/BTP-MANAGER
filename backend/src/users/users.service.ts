import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: { where: { deletedAt: null }, include: { role: true } },
      },
    });

    return users.map((user) => this.toSafeUser(user));
  }

  async create(dto: CreateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email is already used');
    }

    const roles = await this.findRolesOrThrow(dto.roleCodes);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash: await argon2.hash(dto.password),
        createdById: actorId,
        userRoles: {
          create: roles.map((role) => ({ roleId: role.id })),
        },
      },
      include: {
        userRoles: { where: { deletedAt: null }, include: { role: true } },
      },
    });

    return this.toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    await this.ensureExists(id);

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email is already used');
      }
    }

    const roles = dto.roleCodes
      ? await this.findRolesOrThrow(dto.roleCodes)
      : undefined;

    const user = await this.prisma.$transaction(async (tx) => {
      if (roles) {
        await tx.userRole.deleteMany({ where: { userId: id } });
      }

      return tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          email: dto.email?.toLowerCase(),
          phone: dto.phone,
          status: dto.status,
          passwordHash: dto.password
            ? await argon2.hash(dto.password)
            : undefined,
          refreshTokenHash:
            dto.password ||
            dto.status === 'BLOCKED' ||
            dto.status === 'INACTIVE'
              ? null
              : undefined,
          updatedById: actorId,
          userRoles: roles
            ? { create: roles.map((role) => ({ roleId: role.id })) }
            : undefined,
        },
        include: {
          userRoles: { where: { deletedAt: null }, include: { role: true } },
        },
      });
    });

    return this.toSafeUser(user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: { where: { deletedAt: null }, include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toSafeUser(user);
  }

  async softDelete(id: string, actorId: string) {
    await this.ensureExists(id);
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: actorId,
        refreshTokenHash: null,
        status: 'INACTIVE',
      },
    });
    return { success: true };
  }

  async getAuthenticatedUser(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null, status: 'ACTIVE' },
      include: {
        userRoles: {
          where: { deletedAt: null, role: { deletedAt: null } },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { deletedAt: null, permission: { deletedAt: null } },
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.userRoles.map((userRole) => userRole.role.code),
      permissions: Array.from(
        new Set(
          user.userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map(
              (rolePermission) => rolePermission.permission.code,
            ),
          ),
        ),
      ),
    };
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async findRolesOrThrow(roleCodes: string[]) {
    const roles = await this.prisma.role.findMany({
      where: { code: { in: roleCodes }, deletedAt: null },
    });

    if (roles.length !== new Set(roleCodes).size) {
      throw new NotFoundException('One or more roles were not found');
    }

    return roles;
  }

  private toSafeUser(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    status: string;
    createdAt: Date;
    userRoles: { role: { code: string; name: string } }[];
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.userRoles.map((userRole) => ({
        code: userRole.role.code,
        name: userRole.role.name,
      })),
      createdAt: user.createdAt,
    };
  }
}
