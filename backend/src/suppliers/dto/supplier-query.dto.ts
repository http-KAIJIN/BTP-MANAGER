import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SupplierQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['name', 'category', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsIn(['name', 'category', 'createdAt', 'updatedAt'])
  sortBy: 'name' | 'category' | 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'ARCHIVED';
}
