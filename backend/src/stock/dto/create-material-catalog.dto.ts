import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMaterialCatalogDto {
  @ApiProperty({ example: 'Ciment CPJ 45' })
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'kg' })
  @IsString()
  @MaxLength(40)
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 'Lafarge' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  defaultSupplier?: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePriceHT?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tvaRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
