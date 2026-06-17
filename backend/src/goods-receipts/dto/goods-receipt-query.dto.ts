import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GoodsReceiptQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: ['receiptNumber', 'receiptDate', 'createdAt'] })
  @IsOptional()
  @IsIn(['receiptNumber', 'receiptDate', 'createdAt'])
  sortBy: string = 'createdAt';
}
