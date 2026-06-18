import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';

class CreateInvoiceItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 'm²' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() contractReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() siteReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workPhase?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectManager?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) advancePayment?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) advancePercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentSchedule?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentTerms?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) retentionGuarantee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class RegisterPaymentDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER'] })
  @IsString()
  paymentMode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
