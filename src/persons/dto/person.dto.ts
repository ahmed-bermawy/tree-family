import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  treeId?: number;
}

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
