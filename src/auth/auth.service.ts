import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        profile: dto.name ? { create: { name: dto.name } } : undefined,
      },
    });

    return { access_token: this.generateToken(user.id, user.email) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { access_token: this.generateToken(user.id, user.email) };
  }

  async forgotPassword(email: string, lang?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists — return same message
      return { message: true };
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const baseUrl = process.env.FRONTEND_URL || 'https://family-tree.bermawy.tech';
    const resetLink = `${baseUrl}/reset-password/${token}`;

    return {
      message: true,
      resetLink,
      token,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { access_token: this.generateToken(user.id, user.email) };
  }

  private generateToken(userId: number, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  // ---------- Profile ----------

  private profileSelect() {
    return {
      id: true,
      email: true,
      role: true,
      profile: { select: { name: true, avatarUrl: true } },
    } as const;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.profileSelect(),
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.profile?.name || null,
      avatarUrl: user.profile?.avatarUrl || null,
    };
  }

  async updateProfile(userId: number, dto: { name?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already registered');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.email ? { email: dto.email } : {}),
        profile: {
          upsert: {
            create: { name: dto.name ?? null },
            update: { name: dto.name ?? null },
          },
        },
      },
      select: this.profileSelect(),
    });

    // Email changed → re-issue token with new email
    if (dto.email && dto.email !== user.email) {
      return {
        access_token: this.generateToken(updated.id, updated.email),
        ...this.getProfileShape(updated),
      };
    }
    return this.getProfileShape(updated);
  }

  async changePassword(userId: number, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { message: 'Password updated successfully' };
  }

  async updateAvatar(userId: number, avatarUrl: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: { avatarUrl },
            update: { avatarUrl },
          },
        },
      },
      select: this.profileSelect(),
    });
    return this.getProfileShape(updated);
  }

  private getProfileShape(u: {
    id: number;
    email: string;
    role: string;
    profile: { name: string | null; avatarUrl: string | null } | null;
  }) {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.profile?.name || null,
      avatarUrl: u.profile?.avatarUrl || null,
    };
  }
}
