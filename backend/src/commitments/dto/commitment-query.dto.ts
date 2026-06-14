import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CommitmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['commitmentDate', 'agreedAmount', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsIn(['commitmentDate', 'agreedAmount', 'createdAt', 'updatedAt'])
  sortBy: 'commitmentDate' | 'agreedAmount' | 'createdAt' | 'updatedAt' =
    'createdAt';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: ['supplier', 'intervenant'] })
  @IsOptional()
  @IsIn(['supplier', 'intervenant', 'SUPPLIER', 'INTERVENANT'])
  beneficiaryType?: 'supplier' | 'intervenant' | 'SUPPLIER' | 'INTERVENANT';

  @ApiPropertyOptional({
    enum: ['OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERPAID', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERPAID', 'CANCELLED'])
  status?: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID' | 'CANCELLED';
}
