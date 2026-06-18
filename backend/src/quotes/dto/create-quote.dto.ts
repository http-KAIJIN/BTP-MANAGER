import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, MinLength, ValidateNested, IsNumber, Min } from 'class-validator';

class CreateQuoteItemDto {
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

export class CreateQuoteDto {
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
  quoteDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

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

  @ApiProperty({ type: [CreateQuoteItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
}
