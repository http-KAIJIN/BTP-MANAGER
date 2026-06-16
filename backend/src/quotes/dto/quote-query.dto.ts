import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QuoteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED_TO_INVOICE', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['quoteNumber', 'quoteDate', 'totalTTC', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsIn(['quoteNumber', 'quoteDate', 'totalTTC', 'createdAt', 'updatedAt'])
  sortBy: string = 'createdAt';
}
