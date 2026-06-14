import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ExpenseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['expenseDate', 'amount', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsIn(['expenseDate', 'amount', 'createdAt', 'updatedAt'])
  sortBy: 'expenseDate' | 'amount' | 'createdAt' | 'updatedAt' = 'createdAt';
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierId?: string;
}
