import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('dashboard/api/admins')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminsController {
  constructor(private adminsService: AdminsService) {}

  @Get()
  list() {
    return this.adminsService.list();
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.adminsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminDto) {
    return this.adminsService.update(id, dto);
  }

  @Patch(':id/password')
  updatePassword(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePasswordDto) {
    return this.adminsService.updatePassword(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const currentUser = req.user as { id: number };
    return this.adminsService.remove(id, currentUser.id);
  }
}
