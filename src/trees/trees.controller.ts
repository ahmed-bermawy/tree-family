import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TreesService } from './trees.service';
import { CreateTreeDto, UpdateTreeDto } from './dto/tree.dto';

@Controller('trees')
export class TreesController {
  constructor(private treesService: TreesService) {}

  // Public share endpoint — uses shareCode (not ID)
  @Get('share/:shareCode')
  getSharedGraph(@Param('shareCode') shareCode: string) {
    return this.treesService.getSharedGraph(shareCode);
  }

  // Protected endpoints
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTreeDto, @CurrentUser() user: any) {
    return this.treesService.create(dto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: any) {
    return this.treesService.findAll(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.treesService.findOne(id, user.id);
  }

  @Get(':id/graph')
  @UseGuards(JwtAuthGuard)
  getGraph(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.treesService.getGraph(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreeDto,
    @CurrentUser() user: any,
  ) {
    return this.treesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.treesService.remove(id, user.id);
  }
}
