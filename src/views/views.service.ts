import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ViewsService {
  constructor(private prisma: PrismaService) {}

  async track(data: { path: string; referrer?: string; userAgent?: string; ip?: string; userId?: number }) {
    const ipHash = data.ip
      ? createHash('sha256').update(data.ip).digest('hex').slice(0, 16)
      : null;

    return this.prisma.pageView.create({
      data: {
        path: data.path || '/',
        referrer: data.referrer?.slice(0, 500) || null,
        userAgent: data.userAgent?.slice(0, 300) || null,
        ipHash,
        userId: data.userId || null,
      },
    });
  }

  async overview() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const [totalViews, viewsToday, views7d, views30d, uniqueVisitors] = await Promise.all([
      this.prisma.pageView.count(),
      this.prisma.pageView.count({ where: { createdAt: { gte: new Date(now - dayMs) } } }),
      this.prisma.pageView.count({ where: { createdAt: { gte: new Date(now - 7 * dayMs) } } }),
      this.prisma.pageView.count({ where: { createdAt: { gte: new Date(now - 30 * dayMs) } } }),
      this.prisma.pageView.groupBy({ by: ['ipHash'], where: { ipHash: { not: null } }, _count: true }),
    ]);

    return {
      totalViews,
      viewsToday,
      views7d,
      views30d,
      uniqueVisitors: uniqueVisitors.length,
    };
  }

  async daily(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const views = await this.prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const map = new Map<string, number>();
    for (const v of views) {
      const key = v.createdAt.toISOString().slice(0, 10);
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

  async topPages(limit: number = 10) {
    const rows = await this.prisma.pageView.groupBy({
      by: ['path'],
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit,
    });
    return rows.map((r) => ({ path: r.path, views: r._count._all }));
  }
}
