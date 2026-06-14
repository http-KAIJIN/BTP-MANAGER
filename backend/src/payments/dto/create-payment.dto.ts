import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() commitmentId: string;
  @ApiProperty() @IsDateString() paymentDate: string;
  @ApiProperty() @IsNumber() @IsPositive() amount: number;
  @ApiProperty({ enum: ['cash', 'cheque', 'bank_transfer'] })
  @IsIn(['cash', 'cheque', 'bank_transfer', 'CASH', 'CHEQUE', 'BANK_TRANSFER'])
  paymentMode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() chequeNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
