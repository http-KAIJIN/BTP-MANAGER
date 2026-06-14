import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class IntervenantQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['name', 'trade', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsIn(['name', 'trade', 'createdAt', 'updatedAt'])
  sortBy: 'name' | 'trade' | 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trade?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'ARCHIVED';
}
