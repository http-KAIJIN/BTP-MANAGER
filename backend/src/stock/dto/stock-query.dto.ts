import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class StockQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: StockMovementType })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @ApiPropertyOptional({ enum: ['createdAt', 'materialId', 'projectId', 'type', 'quantity'] })
  @IsOptional()
  @IsIn(['createdAt', 'materialId', 'projectId', 'type', 'quantity'])
  sortBy: 'createdAt' | 'materialId' | 'projectId' | 'type' | 'quantity' = 'createdAt';
}
