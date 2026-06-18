import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class CreateGoodsReceiptItemDto {
  @ApiProperty()
  @IsString()
  orderItemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  qtyReceived: number;
}

export class CreateGoodsReceiptDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  receiptDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateGoodsReceiptItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];
}
