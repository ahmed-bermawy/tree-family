import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { StatsService } from './stats.service';

@Controller('dashboard/api')
@UseGuards(JwtAuthGuard, AdminGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('overview')
  getOverview() {
    return this.statsService.getOverview();
  }

  @Get('users')
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.statsService.getUsers(Number(page) || 1, Number(limit) || 20);
  }

  @Get('registrations')
  getRegistrations(@Query('days') days?: string) {
    return this.statsService.getDailyRegistrations(Number(days) || 30);
  }

  @Get('trees')
  getTrees(@Query('days') days?: string) {
    return this.statsService.getDailyTrees(Number(days) || 30);
  }
}
