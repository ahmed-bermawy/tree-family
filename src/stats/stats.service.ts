import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [totalUsers, totalTrees, usersWithTrees, treesLast7Days, usersLast7Days, recentUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.tree.count(),
        this.prisma.user.count({ where: { trees: { some: {} } } }),
        this.prisma.tree.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, email: true, createdAt: true, role: true },
        }),
      ]);

    return {
      totalUsers,
      totalTrees,
      usersWithTrees,
      treesLast7Days,
      usersLast7Days,
      recentUsers,
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: { select: { name: true, avatarUrl: true } },
          _count: { select: { trees: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDailyRegistrations(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const map = new Map<string, number>();
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    }

    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map.get(key) || 0 });
    }
    return result;
  }

  async getDailyTrees(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const trees = await this.prisma.tree.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const map = new Map<string, number>();
    for (const t of trees) {
      const key = t.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    }

    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map.get(key) || 0 });
    }
    return result;
  }
}
