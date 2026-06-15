import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Jouhara 226' })
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Casablanca' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;

  @ApiPropertyOptional({ example: 'Immeuble résidentiel' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  projectType?: string;

  @ApiPropertyOptional({ enum: ['internal_company', 'external_client'] })
  @IsOptional()
  @IsIn([
    'internal_company',
    'external_client',
    'INTERNAL_COMPANY',
    'EXTERNAL_CLIENT',
  ])
  ownershipType?:
    | 'internal_company'
    | 'external_client'
    | 'INTERNAL_COMPANY'
    | 'EXTERNAL_CLIENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerCompanyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalClientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalClientPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalClientCompany?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  executingCompanyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
