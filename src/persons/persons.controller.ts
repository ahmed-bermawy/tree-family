import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PersonsService } from './persons.service';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';

@UseGuards(JwtAuthGuard)
@Controller('persons')
export class PersonsController {
  constructor(private personsService: PersonsService) {}

  @Post()
  create(@Body() dto: CreatePersonDto, @CurrentUser() user: any) {
    return this.personsService.create(dto, user.id);
  }

  @Get('tree/:treeId')
  findByTree(@Param('treeId', ParseIntPipe) treeId: number, @CurrentUser() user: any) {
    return this.personsService.findByTree(treeId, user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.personsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDto,
    @CurrentUser() user: any,
  ) {
    return this.personsService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.personsService.remove(id, user.id);
  }
}
