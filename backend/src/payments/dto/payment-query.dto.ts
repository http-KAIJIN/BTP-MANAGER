import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class PaymentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['paymentDate', 'amount', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsIn(['paymentDate', 'amount', 'createdAt', 'updatedAt'])
  sortBy: 'paymentDate' | 'amount' | 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() commitmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() intervenantId?: string;
  @ApiPropertyOptional({ enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER'] })
  @IsOptional()
  @IsIn(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'cash', 'cheque', 'bank_transfer'])
  paymentMode?: string;
}
