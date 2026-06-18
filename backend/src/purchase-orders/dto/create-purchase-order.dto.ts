import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, Min, MinLength, ValidateNested, IsUUID } from 'class-validator';

class CreatePurchaseOrderItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 'tonne' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  materialId?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

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

  @ApiProperty({ type: [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
