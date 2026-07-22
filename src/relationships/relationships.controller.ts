import {
  Controller, Post, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RelationshipsService } from './relationships.service';
import { CreateRelationshipDto } from './dto/relationship.dto';

@UseGuards(JwtAuthGuard)
@Controller('relationships')
export class RelationshipsController {
  constructor(private relationshipsService: RelationshipsService) {}

  @Post()
  create(@Body() dto: CreateRelationshipDto, @CurrentUser() user: any) {
    return this.relationshipsService.create(dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.relationshipsService.remove(id, user.id);
  }
}
