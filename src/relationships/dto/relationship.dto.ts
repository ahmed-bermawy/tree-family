import { IsEnum, IsInt } from 'class-validator';
import { RelationType } from '@prisma/client';

export class CreateRelationshipDto {
  @IsInt()
  fromPersonId: number;

  @IsInt()
  toPersonId: number;

  @IsEnum(RelationType)
  type: RelationType;
}
