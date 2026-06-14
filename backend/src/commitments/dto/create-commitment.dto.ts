import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCommitmentDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ enum: ['supplier', 'intervenant'] })
  @IsIn(['supplier', 'intervenant', 'SUPPLIER', 'INTERVENANT'])
  beneficiaryType: 'supplier' | 'intervenant' | 'SUPPLIER' | 'INTERVENANT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  intervenantId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  agreedAmount: number;

  @ApiProperty()
  @IsDateString()
  commitmentDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
