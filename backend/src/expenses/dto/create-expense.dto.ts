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

export class CreateExpenseDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() categoryId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierId?: string;
  @ApiProperty() @IsString() @MinLength(2) description: string;
  @ApiProperty() @IsNumber() @IsPositive() amount: number;
  @ApiProperty() @IsDateString() expenseDate: string;
  @ApiProperty({ enum: ['cash', 'cheque', 'bank_transfer'] })
  @IsIn(['cash', 'cheque', 'bank_transfer', 'CASH', 'CHEQUE', 'BANK_TRANSFER'])
  paymentMode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
