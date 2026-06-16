import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class InvoiceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['invoiceNumber', 'invoiceDate', 'totalTTC', 'paidAmount', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsIn(['invoiceNumber', 'invoiceDate', 'totalTTC', 'paidAmount', 'createdAt', 'updatedAt'])
  sortBy: string = 'createdAt';
}
