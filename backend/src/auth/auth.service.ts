import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const authUser = await this.usersService.getAuthenticatedUser(user.id);

    if (!authUser) {
      throw new UnauthorizedException('Invalid user');
    }

    const tokens = await this.createTokens(authUser.id, authUser.email);
    await this.storeRefreshTokenHash(authUser.id, tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: authUser.id },
      data: { lastLoginAt: new Date() },
    });

    return { ...tokens, user: authUser };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
    });

    if (
      !user?.refreshTokenHash ||
      !(await argon2.verify(user.refreshTokenHash, refreshToken))
    ) {
      throw new ForbiddenException('Refresh token is no longer valid');
    }

    const authUser = await this.usersService.getAuthenticatedUser(user.id);

    if (!authUser) {
      throw new UnauthorizedException('Invalid user');
    }

    const tokens = await this.createTokens(authUser.id, authUser.email);
    await this.storeRefreshTokenHash(authUser.id, tokens.refreshToken);

    return { ...tokens, user: authUser };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (
      !user ||
      !(await argon2.verify(user.passwordHash, dto.currentPassword))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshTokenHash: null },
    });

    return { success: true };
  }

  private async createTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessExpiresIn = (this.configService.get<string>('JWT_ACCESS_TTL') ??
      '15m') as SignOptions['expiresIn'];
    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_TTL',
    ) ?? '7d') as SignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshTokenHash(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: await argon2.hash(refreshToken) },
    });
  }
}
