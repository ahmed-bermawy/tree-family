import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { name: true, avatarUrl: true } },
      },
    });
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: 'ADMIN',
        profile: dto.name ? { create: { name: dto.name } } : undefined,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { name: true } },
      },
    });
    return user;
  }

  async update(id: number, dto: UpdateAdminDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Admin not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Email already registered');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        profile: dto.name !== undefined ? { upsert: { create: { name: dto.name }, update: { name: dto.name } } } : undefined,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { name: true, avatarUrl: true } },
      },
    });
  }

  async updatePassword(id: number, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Admin not found');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { message: 'Password updated' };
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Admin not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'Admin removed' };
  }
}
