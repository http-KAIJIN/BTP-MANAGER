import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CompanyQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['name', 'ice', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsIn(['name', 'ice', 'createdAt', 'updatedAt'])
  sortBy: 'name' | 'ice' | 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'ARCHIVED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerName?: string;
}
