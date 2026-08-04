import { Body, Controller, Get, Headers, Ip, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ViewsService } from './views.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller()
export class ViewsController {
  constructor(private viewsService: ViewsService) {}

  // Public tracking endpoint (no auth — called by the frontend on every page view)
  @Post('track')
  track(
    @Body() body: { path?: string; referrer?: string },
    @Headers('user-agent') userAgent?: string,
    @Headers('authorization') auth?: string,
    @Ip() ip?: string,
    @Req() req?: Request,
  ) {
    let userId: number | undefined;
    // If a Bearer token is present, try to resolve the user id from the JWT payload
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        userId = payload.sub;
      } catch {}
    }
    return this.viewsService.track({ path: body.path || '/', referrer: body.referrer, userAgent, ip, userId });
  }

  // Admin analytics
  @Get('dashboard/api/analytics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  analytics() {
    return this.viewsService.overview();
  }

  @Get('dashboard/api/analytics/daily')
  @UseGuards(JwtAuthGuard, AdminGuard)
  daily(@Query('days') days?: string) {
    return this.viewsService.daily(Number(days) || 30);
  }

  @Get('dashboard/api/analytics/pages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  topPages(@Query('limit') limit?: string) {
    return this.viewsService.topPages(Number(limit) || 10);
  }
}
