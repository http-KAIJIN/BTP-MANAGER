import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: [
      'name',
      'city',
      'startDate',
      'expectedEndDate',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsOptional()
  @IsIn([
    'name',
    'city',
    'startDate',
    'expectedEndDate',
    'createdAt',
    'updatedAt',
  ])
  sortBy:
    | 'name'
    | 'city'
    | 'startDate'
    | 'expectedEndDate'
    | 'createdAt'
    | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerCompanyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  executingCompanyId?: string;

  @ApiPropertyOptional({ enum: ['INTERNAL_COMPANY', 'EXTERNAL_CLIENT'] })
  @IsOptional()
  @IsIn([
    'INTERNAL_COMPANY',
    'EXTERNAL_CLIENT',
    'internal_company',
    'external_client',
  ])
  ownershipType?:
    | 'INTERNAL_COMPANY'
    | 'EXTERNAL_CLIENT'
    | 'internal_company'
    | 'external_client';

  @ApiPropertyOptional({
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
}
