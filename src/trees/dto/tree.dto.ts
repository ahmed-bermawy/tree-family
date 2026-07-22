import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateTreeDto {
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateTreeDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;
}
