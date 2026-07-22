import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TreesService } from './trees.service';
import { CreateTreeDto, UpdateTreeDto } from './dto/tree.dto';

@UseGuards(JwtAuthGuard)
@Controller('trees')
export class TreesController {
  constructor(private treesService: TreesService) {}

  @Post()
  create(@Body() dto: CreateTreeDto, @CurrentUser() user: any) {
    return this.treesService.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.treesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.treesService.findOne(id, user.id);
  }

  @Get(':id/graph')
  getGraph(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.treesService.getGraph(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreeDto,
    @CurrentUser() user: any,
  ) {
    return this.treesService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.treesService.remove(id, user.id);
  }
}
