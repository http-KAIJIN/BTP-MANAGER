import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class PurchaseOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'SENT', 'APPROVED', 'RECEIVED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['orderNumber', 'orderDate', 'expectedDate', 'totalTTC', 'status', 'createdAt', 'updatedAt', 'supplier'] })
  @IsOptional()
  @IsIn(['orderNumber', 'orderDate', 'expectedDate', 'totalTTC', 'status', 'createdAt', 'updatedAt', 'supplier'])
  sortBy: string = 'createdAt';
}
