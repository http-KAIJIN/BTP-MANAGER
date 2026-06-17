import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MaterialQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ['name', 'createdAt', 'updatedAt', 'currentQty', 'unitPrice'] })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt', 'currentQty', 'unitPrice'])
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'currentQty' | 'unitPrice' = 'name';
}
